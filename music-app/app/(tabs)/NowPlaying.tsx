import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { useMusic } from '../context/musicContext';
import { useRouter } from 'expo-router';

export default function NowPlayingScreen() {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the music context and router
  const { currentSong, setCurrentSong } = useMusic();
  const router = useRouter();

  useEffect(() => {
    // Initialize audio settings
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Failed to set audio mode:', error);
      }
    };
    
    setupAudio();
  }, []);

  useEffect(() => {
    // Load and play the current song
    if (currentSong) {
      loadAudio();
    } else {
      // If no current song, show a message and go back
      Alert.alert('No Song', 'No song is currently selected.');
      router.back();
    }

    // Cleanup when component unmounts
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [currentSong]);

  useEffect(() => {
    // Update position every second when playing
    let interval;
    if (isPlaying) {
      interval = setInterval(async () => {
        if (sound) {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              setPosition(status.positionMillis);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
                await sound.setPositionAsync(0);
              }
            }
          } catch (error) {
            console.error('Error getting sound status:', error);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, sound]);

  const loadAudio = async () => {
    if (sound) {
      await sound.unloadAsync();
    }

    setIsLoading(true);
    try {
      // Check if song.sound is already available from context
      if (currentSong.sound) {
        setSound(currentSong.sound);
        const status = await currentSong.sound.getStatusAsync();
        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setPosition(status.positionMillis || 0);
          
          // Start playing and update state
          await currentSong.sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        // Otherwise create a new sound object
        const { sound: newSound } = await Audio.Sound.createAsync(
          currentSong.isAssetMusic ? currentSong.uri : { uri: currentSong.uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        
        // Update the currentSong in context with the sound object
        if (setCurrentSong) {
          setCurrentSong({ ...currentSong, sound: newSound });
        }
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Could not play this song');
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
    } else if (status.error) {
      console.error('Playback status error:', status.error);
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        console.log('Pausing audio...');
        await sound.pauseAsync();
        setIsPlaying(false);  // Make sure we update the state after pausing
      } else {
        console.log('Playing audio...');
        await sound.playAsync();
        setIsPlaying(true);   // Make sure we update the state after playing
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      Alert.alert('Playback Error', 'Failed to toggle playback state');
    }
  };

  const skipForward = async () => {
    if (!sound) return;
    
    try {
      // Skip forward 10 seconds
      const newPosition = Math.min(position + 10000, duration);
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (error) {
      console.error('Error skipping forward:', error);
      Alert.alert('Feature', 'Skip to next song feature coming soon!');
    }
  };

  const skipBackward = async () => {
    if (!sound) return;
    
    try {
      // Skip backward 10 seconds
      const newPosition = Math.max(position - 10000, 0);
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (error) {
      console.error('Error skipping backward:', error);
      Alert.alert('Feature', 'Skip to previous song feature coming soon!');
    }
  };

  const handleSliderChange = async (value) => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(value);
      setPosition(value);
    } catch (error) {
      console.error('Error setting position:', error);
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isPlayingOrPaused = sound !== null && !isLoading;

  return (
    <View style={styles.nowPlayingContainer}>
      <LinearGradient
        colors={['#8A2BE2', '#4B0082']}
        style={styles.nowPlayingHeader}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.nowPlayingHeaderTitle}>Now Playing</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.albumArtContainer}>
        <Image 
          source={currentSong?.cover || require('../../assets/images/burnaboy.jpeg')} 
          style={styles.albumArt} 
        />
      </View>

      <View style={styles.songInfoContainer}>
        <Text style={styles.nowPlayingSongTitle}>{currentSong?.title || 'Unknown Song'}</Text>
        <Text style={styles.nowPlayingSongArtist}>{currentSong?.artist || 'Unknown Artist'}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={handleSliderChange}
          minimumTrackTintColor="#8A2BE2"
          maximumTrackTintColor="#D1C4E9"
          thumbTintColor="#8A2BE2"
          disabled={!isPlayingOrPaused}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={skipBackward}
          disabled={!isPlayingOrPaused}
        >
          <Ionicons 
            name="play-skip-back" 
            size={36} 
            color={isPlayingOrPaused ? "#333" : "#AAA"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.playPauseButton,
            !isPlayingOrPaused && { backgroundColor: '#A78BC9' }
          ]} 
          onPress={togglePlayback}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : (
            <Ionicons name={isPlaying ? "pause" : "play"} size={48} color="#FFF" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={skipForward}
          disabled={!isPlayingOrPaused}
        >
          <Ionicons 
            name="play-skip-forward" 
            size={36} 
            color={isPlayingOrPaused ? "#333" : "#AAA"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.additionalControlsContainer}>
        <TouchableOpacity style={styles.additionalControlButton}>
          <Ionicons name="repeat" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.additionalControlButton}>
          <Ionicons name="shuffle" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.additionalControlButton}>
          <Ionicons name="heart-outline" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.additionalControlButton}>
          <Ionicons name="list" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nowPlayingContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  nowPlayingHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  albumArtContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  albumArt: {
    width: 280,
    height: 280,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  songInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  nowPlayingSongTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  nowPlayingSongArtist: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  controlButton: {
    padding: 10,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  additionalControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  additionalControlButton: {
    padding: 10,
  },
});