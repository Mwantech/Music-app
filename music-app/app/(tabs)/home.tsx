import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AddPlaylistForm from '../components/AddPlaylistForm';
import PlaylistView from '../components/PlaylistView';

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);
  const [recentSongs, setRecentSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPlaylistView, setShowPlaylistView] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [topArtists, setTopArtists] = useState([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const [userDataString, recentSongsString, playlistsString] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('recentSongs'),
          AsyncStorage.getItem('playlists')
        ]);
        
        if (userDataString) {
          setUserData(JSON.parse(userDataString));
        }
        if (recentSongsString) {
          setRecentSongs(JSON.parse(recentSongsString));
        }
        if (playlistsString) {
          setPlaylists(JSON.parse(playlistsString));
        }

        // Sample data for featured playlists and top artists
        setFeaturedPlaylists([
          { id: '1', name: 'Chill Vibes', songs: 24, cover: require('../../assets/images/burnaboy.jpeg') },
          { id: '2', name: 'Workout Mix', songs: 18, cover: require('../../assets/images/burnaboy.jpeg') },
          { id: '3', name: 'Road Trip', songs: 32, cover: require('../../assets/images/burnaboy.jpeg') },
          { id: '4', name: 'Party Hits', songs: 40, cover: require('../../assets/images/burnaboy.jpeg') }
        ]);

        setTopArtists([
          { id: '1', name: 'The Weeknd', genre: 'R&B / Pop', image: require('../../assets/images/chriss.jpeg') },
          { id: '2', name: 'Taylor Swift', genre: 'Pop', image: require('../../assets/images/burnaboy.jpeg') },
          { id: '3', name: 'Kendrick Lamar', genre: 'Hip-Hop', image: require('../../assets/images/joeboy.jpeg') },
          { id: '4', name: 'Dua Lipa', genre: 'Pop', image: require('../../assets/images/postmalone.jpeg') }
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load your music data');
      }
    };

    initialize();
  }, []);

  const addPlaylist = async (playlistData) => {
    try {
      const newPlaylist = {
        id: Date.now().toString(),
        name: playlistData.name,
        description: playlistData.description,
        isPublic: playlistData.isPublic,
        songs: [],
        createdAt: new Date().toISOString(),
        coverImage: playlistData.coverImage || require('../../assets/images/burnaboy.jpeg')
      };

      // Update state
      const updatedPlaylists = [...playlists, newPlaylist];
      setPlaylists(updatedPlaylists);

      // Save to AsyncStorage
      await AsyncStorage.setItem('playlists', JSON.stringify(updatedPlaylists));

      Alert.alert('Success', 'Playlist has been created');
    } catch (error) {
      console.error('Error adding playlist:', error);
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const viewPlaylist = (playlist) => {
    setCurrentPlaylist(playlist);
    setShowPlaylistView(true);
  };

  const playSong = async (song) => {
    try {
      // In a real app, this would trigger the music player
      Alert.alert('Playing', `Now playing: ${song.title} by ${song.artist}`);
      
      // Add to recent songs
      const updatedRecentSongs = [song, ...recentSongs.filter(s => s.id !== song.id)].slice(0, 10);
      setRecentSongs(updatedRecentSongs);
      await AsyncStorage.setItem('recentSongs', JSON.stringify(updatedRecentSongs));
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#8A2BE2', '#4B0082']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good evening,</Text>
            <Text style={styles.userName}>{userData?.fullName || 'Music Lover'}!</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Featured Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Playlists</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
            {featuredPlaylists.map(playlist => (
              <TouchableOpacity 
                key={playlist.id} 
                style={styles.featuredItem}
                onPress={() => viewPlaylist(playlist)}
              >
                <Image source={playlist.cover} style={styles.featuredCover} />
                <Text style={styles.featuredTitle}>{playlist.name}</Text>
                <Text style={styles.featuredSubtitle}>{playlist.songs} songs</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Top Artists Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Artists</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
            {topArtists.map(artist => (
              <TouchableOpacity 
                key={artist.id} 
                style={styles.artistItem}
              >
                <Image source={artist.image} style={styles.artistImage} />
                <Text style={styles.artistName}>{artist.name}</Text>
                <Text style={styles.artistGenre}>{artist.genre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recently Played Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          {recentSongs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recently played songs</Text>
              <Text style={styles.emptyStateAction}>Start listening to see your history</Text>
            </View>
          ) : (
            recentSongs.slice(0, 5).map(song => (
              <TouchableOpacity 
                key={song.id} 
                style={styles.songCard}
                onPress={() => playSong(song)}
              >
                <Image source={song.cover} style={styles.songCover} />
                <View style={styles.songDetails}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songArtist}>{song.artist}</Text>
                </View>
                <TouchableOpacity style={styles.playButton}>
                  <Ionicons name="play-circle" size={36} color="#8A2BE2" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Now Playing Bar */}
      <View style={styles.nowPlayingBar}>
        <Image 
          source={require('../../assets/images/burnaboy.jpeg')} 
          style={styles.nowPlayingCover} 
        />
        <View style={styles.nowPlayingInfo}>
          <Text style={styles.nowPlayingTitle}>Blinding Lights</Text>
          <Text style={styles.nowPlayingArtist}>The Weeknd</Text>
        </View>
        <View style={styles.playbackControls}>
          <TouchableOpacity style={styles.playbackButton}>
            <Ionicons name="play-skip-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playbackButton}>
            <Ionicons name="pause" size={30} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playbackButton}>
            <Ionicons name="play-skip-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Playlist Modal */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <AddPlaylistForm
            onSubmit={(playlistData) => {
              addPlaylist(playlistData);
              setShowAddForm(false);
            }}
            onClose={() => setShowAddForm(false)}
          />
        </View>
      </Modal>

      {/* Playlist View Modal */}
      {currentPlaylist && (
        <Modal
          visible={showPlaylistView}
          animationType="slide"
          onRequestClose={() => setShowPlaylistView(false)}
        >
          <PlaylistView 
            playlist={currentPlaylist}
            onClose={() => {
              setShowPlaylistView(false);
              setCurrentPlaylist(null);
            }}
            onPlay={playSong}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#E0E0E0',
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '700',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8A2BE2',
  },
  tabText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#8A2BE2',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  horizontalScrollContent: {
    paddingRight: 20,
  },
  featuredItem: {
    width: 160,
    marginRight: 15,
  },
  featuredCover: {
    width: 160,
    height: 160,
    borderRadius: 8,
    marginBottom: 10,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  featuredSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  artistItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 100,
  },
  artistImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  artistGenre: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptyStateAction: {
    fontSize: 16,
    color: '#8A2BE2',
    fontWeight: '500',
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
  },
  songCover: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  songDetails: {
    flex: 1,
    marginLeft: 15,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  songArtist: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  playButton: {
    padding: 5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#F0E6FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
  },
  playlistCardCover: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  playlistDetails: {
    flex: 1,
    marginLeft: 15,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  playlistSongs: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  nowPlayingBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 15,
  },
  nowPlayingCover: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  nowPlayingInfo: {
    flex: 1,
    marginLeft: 15,
  },
  nowPlayingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  nowPlayingArtist: {
    fontSize: 13,
    color: '#666',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playbackButton: {
    padding: 5,
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  }
});