import React, {Component} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView, Dimensions, YellowBox } from 'react-native';
import {Icon, Input, Left, Right} from 'native-base';
import DrawerLayout from 'react-native-gesture-handler/DrawerLayout';

import Chatbox_my from './chatbox/mychat';
import Chatbox_other from './chatbox/otherchat';
import Chatbox_quizbot from './chatbox/quizbot';
import ChatroomSideMenu from './Chatroom-SideMenu';

import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('db.db');

const screenWidth = Math.round(Dimensions.get('window').width);
const screenHeight = Math.round(Dimensions.get('window').height);
const io = require('socket.io-client');

YellowBox.ignoreWarnings([  // 강제로 에러 안뜨게 하기
    'Unrecognized WebSocket connection option(s) `agent`, `perMessageDeflate`, `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`. Did you mean to put these under `headers`?'
]);

export default class Chatroom extends Component {
    constructor(props){
        super(props);
        this.messageInput = React.createRef();
        this.socket = io('http://101.101.160.185:3000');
        this.socket.on('RECEIVE_MESSAGE', function(data){
            db_Add(data);
        });
        this.socket.on('disconnect', function(){
            console.log('disconnect');
        })
        db_Add = (newChat) => {
            db.transaction( tx => {
                tx.executeSql(
                    'INSERT INTO chatLog (user_email, cr_id, Time, message, answer) values (?, ?, ?, ?, ?);',
                    [newChat.user_email, newChat.cr_id, newChat.Time, newChat.message, newChat.answer],
                    null,
                    (_,error) => console.error(error)   // sql문 실패 에러
                );
            },(error) => console.error(error))          // 트랜젝션 에러
            this.db_Update()
        }
    };

    state = {
        cr_id: '1',
        cr_name: '',
        message: '',
        myEmail: '',
        chatlog:[], // 채팅로그
        userlist:[], // 유저 목록
        token: '',
        key: 0,
    }

    static navigationOptions = {
        header: null
    }

    componentWillMount() {
        const { navigation } = this.props;
        this.state.cr_id = navigation.getParam('cr_id', '-1'),
        this.state.cr_name = navigation.getParam('title', 'No cr_name')
        this.state.myEmail = navigation.getParam('myEmail', '');

        db.transaction(tx => {
            tx.executeSql(  // token에서 user_email 읽어오기
                'SELECT * FROM token',
                [],
                (_, { rows: { _array }  }) => {
                    this.state.token = _array[0].access_token
                    this.socket.emit('JOIN_ROOM', {cr_id : this.state.cr_id, myEmail : this.state.myEmail})},
                (_,error) => console.error(error)
            )
        },(error) => console.error(error))
        this.db_Update();
        this._getParticipants();  // 방 인원 불러오기
    }

    renderDrawer = () => {
        return (
            <View>
                <ChatroomSideMenu goBack={() => this.props.navigation.goBack(null)} userlist={this.state.userlist}/>
            </View>
        );
    };

    _onPressSend(){
        this.messageInput.current._root.clear();
        if (this.state.message.length != 0){
            const newChat = {
                user_email: this.state.myEmail,
                cr_id: this.state.cr_id,
                Time: Date(),
                message: this.state.message,
                //answer: null
            }
            this.setState({message: ''});    
            this.socket.emit('SEND_MESSAGE', newChat);
        }
    }

    _getParticipants() {
        var url = 'http://101.101.160.185:3000/chatroom/participants/'+this.state.cr_id;
        fetch(url, {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json',
                'x-access-token': this.state.token
            }),
        }).then(response => response.json())
        .catch(error => console.error('Error: ', error))
        .then(responseJson => this.setState({userlist: responseJson}))
    }

    _receivePopQuiz(question, answer){ // 서버로부터 팝퀴즈 받으면 DB에 넣는 작업
        const newQuiz = {
            user_email: 'PopQuizBot',
            cr_id: this.state.cr_id,
            Time: Date(),
            message: question,
            answer: answer,
        }
        // todo: 받은 팝퀴즈를 db에 저장
    }

    db_Update = () => {        // DB 내의 채팅 로그 읽어오기
        db.transaction( tx => {
            tx.executeSql(
                'SELECT * FROM chatLog WHERE cr_id = ? LIMIT 200',  //  일단 200개만 읽어오도록
                [this.state.cr_id],
                (_, { rows: { _array }  }) => this.setState({ chatlog: _array }),
                (_,error) => console.error(error)
            )
        },(error) => console.error(error)
        )
    };

    db_Rebuild = () => {        // DB attribute가 다른 이유로 input에 실패 할 때, 디비를 다시 build시킴
        db.transaction( tx => {
            tx.executeSql(
                'DROP TABLE chatLog',
                [this.state.cr_id],
                (_, { rows: { _array }  }) => this.setState({ chatlog: _array }),
                (_,error) => console.error(error)
            )
            tx.executeSql(
                'CREATE TABLE if not exists chatLog (user_email TEXT NOT NULL, cr_id INTEGER NOT NULL, Time TEXT NOT NULL, message TEXT NOT NULL, answer TEXT, PRIMARY KEY("user_email","cr_id","Time"))',
                [],
                null,
                (_,error) => console.error(error)
            )
        },(error) => console.error(error)
        )
    };

    handleBackButton = () => {  // 뒤로가기 누르면 전 탭으로 돌아감
        goback()
    };

    render() {
        const { goBack } = this.props.navigation;
        return (
            <DrawerLayout
                ref={ drawer => this.drawer = drawer }
                drawerWidth={screenWidth*0.6}
                drawerPosition={DrawerLayout.positions.Right}
                drawerType='front'
                drawerBackgroundColor="#555"
                renderNavigationView={this.renderDrawer}>
                <View style={style.header}>
                    <Left>
                        <TouchableOpacity onPress={() => goBack(null)}>
                            <Icon name='md-arrow-round-back' style={{color: '#999', fontSize: 30}}/>
                        </TouchableOpacity>
                    </Left>
                    <View style={{justifyContent: 'flex-start'}}>
                        <Text style={[style.font_header]}>{this.state.cr_name}
                            <Text style={{fontSize:15, color: '#ee0'}}>  {this.state.userlist.length}</Text>
                        </Text>
                    </View>
                    <Right>
                        <TouchableOpacity onPress={() => this.drawer.openDrawer()}>
                            <Icon name='md-menu' style={{color: '#999', fontSize: 30}}/>
                        </TouchableOpacity>
                    </Right>
                </View>
                <KeyboardAvoidingView behavior="padding" enabled keyboardVerticalOffset={0} style={style.container}>
                    <ScrollView
                        ref={scrollView => {
                            this.scrollView = scrollView;
                        }}
                        onContentSizeChange={(contentWidth, contentHeight) => {     // 자동 스크롤
                            this.scrollView.scrollTo({
                                x: 0,
                                y: contentHeight + contentHeight - screenHeight,
                                animated: true,
                            })
                        }}
                        style={{width: '100%'}}>
                        {this.state.chatlog.map( chatlog => (chatlog.user_email == this.state.myEmail    // 말풍선 만들기
                            ? (<View key={this.state.key++} style={style.my_chat}>
                                <Chatbox_my data={chatlog}/>
                            </View>)
                            : ( chatlog.user_email != 'PopQuizBot' 
                                ? (<View key={this.state.key++} style={style.other_chat}>
                                    <Chatbox_other data={chatlog}/>
                                </View>)
                                : (<View key={this.state.key++} style={style.other_chat}>
                                    <Chatbox_quizbot data={chatlog}/>
                                </View>)
                            )
                        ))}
                    </ScrollView>
                    <View style={style.inputPlace}>
                        <Input onChangeText={(message) => this.setState({message})}
                            ref={this.messageInput}
                            onSubmitEditing={() => {this._onPressSend();}}  // 엔터눌러도 입력되도록 함
                            value={this.state.message}
                            placeholder='Enter message'
                            style={{marginLeft: 6, fontSize: 16}}/>
                        <TouchableOpacity onPress={() => this._onPressSend()}>
                            <Icon name='md-send' style={{color: '#555', marginRight: 10, fontSize: 30}}/>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </DrawerLayout>
        );
    }
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        width:'100%',
        height: 78,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 30,
        paddingLeft: 15,
        paddingRight: 15,
        paddingBottom: 8,
        backgroundColor: '#333',
    },
    font_header: {
        color: 'white',
        fontSize: 30,
        alignItems: 'center',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        width: '100%',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
    my_chat: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
    },
    other_chat: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-start',
    },
    inputPlace: {
        height: 45,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f6f6f6',
        borderWidth: 0,
    },
    font_main: {
        color: '#aaa',
        fontSize: 20,
        alignItems: 'center',
    },
});
