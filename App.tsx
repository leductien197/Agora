import React, { Component, useState, useEffect } from 'react'
import { Platform, ScrollView, Text, TouchableOpacity, View, PermissionsAndroid } from 'react-native'
// Import the RtcEngine class and view rendering components into your project.
import RtcEngine, { RtcLocalView, RtcRemoteView, VideoRenderMode, ChannelProfile, ClientRole, } from 'react-native-agora'
// Import the UI styles.
import styles from './components/Style'

const requestCameraAndAudioPermission = async () => {
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ])
    if (
      granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
      && granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log('You can use the cameras & mic')
    } else {
      console.log('Permission denied')
    }
  } catch (err) {
    console.warn('permission reject: ', err)
  }
}

interface State {
  appId: string,
  channelName: string,
  token: string,
  joinSucceed: boolean,
  peerIds: number[],
  _engine?: RtcEngine
}

// Create an App component, which extends the properties of the Pros and State interfaces.
const App = (props: State) => {
  let { _engine } = props
  const [state, setState] = useState({
    appId: '557312f41ee04f8ea273026e69ce61b5',
    channelName: 'DucTien',
    token: '00603de11a7cc71448daa454f530dc318eeIAAJ9pDbhm36Zh1Zgdsv0okhqJmf+04RpR9+forGApaW0hykvBkAAAAAEAAm+nFWK3HlYAEAAQAqceVg',
    joinSucceed: false,
    peerIds: [],
  })

  if (Platform.OS === 'android') {
    requestCameraAndAudioPermission().then(() => {
      console.log('requested!')
    })
  }

  useEffect(() => {
    init()
  })

  // Mount the App component into the DOM.

  // Pass in your App ID through state, create and initialize an RtcEngine object.
  const init = async () => {
    let appId = state.appId
    _engine = await RtcEngine.create(appId)
    // Enable the video module.
    await _engine.enableVideo()
    // Enable the local video preview.
    await _engine.startPreview()
    // Set the channel profile as live streaming.
    await _engine.setChannelProfile(ChannelProfile.LiveBroadcasting)
    // Set the usr role as host.
    await _engine.setClientRole(ClientRole.Broadcaster)

    // Listen for the UserJoined callback.
    // This callback occurs when the remote user successfully joins the channel.
    _engine.addListener('UserJoined', (uid, elapsed) => {
      console.log('UserJoined', uid, elapsed)
      let peerIds = state.peerIds
      if (peerIds.indexOf(uid) === -1) {
        setState({

          peerIds: [...peerIds, uid]
        })
      }
    })

    // Listen for the UserOffline callback.
    // This callback occurs when the remote user leaves the channel or drops offline.
    _engine.addListener('UserOffline', (uid, reason) => {
      console.log('UserOffline', uid, reason)
      let peerIds = state.peerIds
      setState({

        // Remove peer ID from state array
        peerIds: peerIds.filter(id => id !== uid)
      })
    })

    // Listen for the JoinChannelSuccess callback.
    // This callback occurs when the local user successfully joins the channel.
    _engine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
      console.log('JoinChannelSuccess', channel, uid, elapsed)
      setState({

        joinSucceed: true
      })
    })
  }

  const startCall = async () => {
    await _engine?.joinChannel(state.token, state.channelName, null, 0)
  }

  const _renderVideos = () => {
    let joinSucceed = state.joinSucceed
    return joinSucceed ? (
      <View style={styles.fullView}>
        <RtcLocalView.SurfaceView
          style={styles.max}
          channelId={state.channelName}
          renderMode={VideoRenderMode.Hidden} />
        {_renderRemoteVideos()}
      </View>
    ) : null
  }

  const _renderRemoteVideos = () => {
    let peerIds = state.peerIds
    return (
      <ScrollView
        style={styles.remoteContainer}
        contentContainerStyle={{ paddingHorizontal: 2.5 }}
        horizontal={true}>
        {peerIds?.map((value, index, array) => {
          return (
            <RtcRemoteView.SurfaceView
              style={styles.remote}
              uid={value}
              channelId={state.channelName}
              renderMode={VideoRenderMode.Hidden}
              zOrderMediaOverlay={true} />
          )
        })}
      </ScrollView>
    )
  }

  const endCall = async () => {
    await _engine?.leaveChannel()
    setState({ peerIds: [], joinSucceed: false })
  }

  return (
    <View style={styles.max}>
      <View style={styles.max}>
        <View style={styles.buttonHolder}>
          <TouchableOpacity
            onPress={startCall}
            style={styles.button}>
            <Text style={styles.buttonText}> Start Call </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={endCall}
            style={styles.button}>
            <Text style={styles.buttonText}> End Call </Text>
          </TouchableOpacity>
        </View>
        {_renderVideos()}
      </View>
    </View>
  )
}

export default App;