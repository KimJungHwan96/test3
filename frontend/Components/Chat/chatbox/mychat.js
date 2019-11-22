import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'native-base';

export default class mychat extends Component {
    render() {
        const data = this.props.data;
        return (
            <View style={style.content}>
                <Text style={style.text_time}>{data.Time.toString().substr(16, 5)}  </Text>
                <Button info style={style.messageBox}>
                    <Text style={style.text_message}> {data.message} </Text>
                </Button>
            </View>
        );
    }
}

const style = StyleSheet.create({
    content: {
        width: '70%',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        marginLeft: '30%',
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
    },
    messageBox: {
        paddingLeft: 5,
        paddingRight: 5,
        backgroundColor: "#ee3",
        borderRadius: 6
    },
    text_time: {
        fontSize : 12,
        color: '#000',
    },
    text_message: {
        fontSize: 15,
    },
})