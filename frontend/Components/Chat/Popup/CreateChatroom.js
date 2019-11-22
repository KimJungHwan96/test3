import React, { Component } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, ToastAndroid } from 'react-native'
import { Button, Item, Label, Input } from 'native-base'

import SectionPicker from './SectionPicker'
import GroupPicker from './GroupPicker'

export default class CreateChatroom extends Component {
    constructor(props){
        super(props)
    }

    state = {
        selectedSection: 'noValue',
        selectedGroup: 'noValue',
        new_cr_name: '',
        display: this.props.display
    }

    sectionChange = (value) => {
        this.setState({
            selectedSection: value,
            selectedGroup: 'noValue'
        })
    }

    groupChange = (value) => {
        this.setState({
            selectedGroup: value, 
        })
    }

    _onPressCancel = () => {
        this.popupClose()
    }

    _onPressAdmit = () => {
        if (this.state.selectedGroup ==  'noValue') {
            ToastAndroid.show('Please select interest.', ToastAndroid.SHORT)
            return
        } else if (this.state.new_cr_name ==  '') {
            ToastAndroid.show('Please input Room name.', ToastAndroid.SHORT)
            return
        }
        const new_room = {
            interest: {
                section: this.state.selectedSection,
                group: this.state.selectedGroup,
            },
            name: this.state.new_cr_name,
        }
        var url = 'http://101.101.160.185:3000/chatroom/creation';
        fetch(url, {
            method: 'POST',
            headers: new Headers({
            'Content-Type': 'application/json',
            'x-access-token': this.props.token
            }),
            body: JSON.stringify(new_room)
        }).then(response => response.json())
        .catch(error => console.error('Error: ', error))
        .then(responseJson=>{
            this.props.pushNewRoom(responseJson)
        })
        ToastAndroid.show('Chat room creation complete.', ToastAndroid.SHORT);
        this.popupClose()
    }

    popupClose = () => {
        this.setState({
            selectedSection: 'noValue',
            selectedGroup: 'noValue',
            new_cr_name: '',
        })
        this.props.displayChange('none');
    }

    render() {
        return (
            <View style={[style.container, {display: this.props.display}]}>
                <View style={[style.backGround, {display: this.props.display}]}>
                    <View style={style.content}>
                        <Text style={style.font_Title}>Create Chatroom</Text>
                        <View style={{height: 45, width: 250, margin:10}}>
                            <SectionPicker valueChange={this.sectionChange}/>
                        </View>
                        <View style={{height: 45, width: 250}}>
                            <GroupPicker selectedSection={this.state.selectedSection} valueChange={this.groupChange}/>
                        </View>
                        <Item style={{height: 48, width: 250, marginTop: 15}} floatingLabel>
                            <Label style={{color: '#aaa'}}> Room name</Label>
                            <Input style={{fontSize: 16, color: '#ddd', paddingLeft: 8}} onChangeText={(new_cr_name) => this.setState({new_cr_name})}/>
                        </Item>
                        <View style={style.pickerContainer}>
                            <TouchableOpacity>
                                <Button onPress={() => this._onPressCancel()} style={{backgroundColor: '#bbb', width: 80, justifyContent: 'center', marginRight:20}}>
                                    <Text>Cancel</Text>
                                </Button>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Button onPress={() => this._onPressAdmit()} style={{backgroundColor: '#4d4', width: 80, justifyContent: 'center', marginLeft:20}}>
                                    <Text>Admit</Text>
                                </Button>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        )   
    }
}

const style = StyleSheet.create({
    container: {
        flex: 4,
        position : 'absolute',
        width: '100%',
        height: '100%',
    },
    backGround: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    content: {
        width: 300,
        height: 400,
        borderRadius: 20,
        backgroundColor: 'rgba(44,44,44,0.90)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    font_Title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#ddd',
        margin: 15,
    },
    pickerContainer: {
        flexDirection : 'row',
        margin: 35,
        justifyContent: 'center',
    },
})