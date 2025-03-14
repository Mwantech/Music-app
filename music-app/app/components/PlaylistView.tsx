import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const PlaylistView = ({ playlist, onClose, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // If playlist doesn't have songs, create some sample songs
  const songs = playlist.songs && playlist.songs.length > 0 
    ? playlist.songs 
    : [
        { id: '1', title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', cover: require('@/assets/images/postmalone.jpeg') },
        { id: '2', title: 'Save Your Tears', artist: 'The Weeknd', duration: '3:35', cover: require('@/assets/images/burnaboy.jpeg') },
        { id: '3', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', duration: '3:50', cover: require('@/assets/images/chriss.jpeg') },
        { id: '4', title: 'After Hours', artist: 'The Weeknd', duration: '6:01', cover: require('@/assets/images/joeboy.jpeg') },
      ];

  const handlePlayAll = () => {
    setIsPlaying(!isPlaying);
    if (songs.length > 0) {
      onPlay(songs[0]);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my "${playlist.name}" playlist on Music App!`,
      });
    } catch (error) {
      console.error('Error sharing playlist:', error);
    }
  };

  const renderSongItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.songItem}
      onPress={() => onPlay(item)}
    >
      <Text style={styles.songNumber}>{index + 1}</Text>
      <Image 
        source={typeof item.cover === 'string' ? { uri: item.cover } : item.cover} 
        style={styles.songCover} 
      />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
      </View>
      <Text style={styles.songDuration}>{item.duration}</Text>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const playlistCover = typeof playlist.coverImage === 'string' 
    ? { uri: playlist.coverImage } 
    : playlist.coverImage;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with playlist cover and info */}
      <LinearGradient
        colors={['#8A2BE2', '#4B0082', '#000000']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-down" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.playlistInfo}>
          <Image 
            source={playlistCover} 
            style={styles.playlistCover} 
          />
          <Text style={styles.playlistName}>{playlist.name}</Text>
          {playlist.description && (
            <Text style={styles.playlistDescription}>{playlist.description}</Text>
          )}
          <View style={styles.playlistMeta}>
            <Text style={styles.playlistMetaText}>
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </Text>
            {playlist.createdAt && (
              <Text style={styles.playlistMetaText}>
                • Created {new Date(playlist.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.playlistActions}>
          <TouchableOpacity style={styles.shuffleButton}>
            <Ionicons name="shuffle" size={20} color="#8A2BE2" />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.playButton, isPlaying && styles.pauseButton]}
            onPress={handlePlayAll}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={20} 
              color="#FFF" 
            />
            <Text style={styles.playText}>
              {isPlaying ? 'Pause' : 'Play All'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Songs List */}
      <FlatList
        data={songs}
        renderItem={renderSongItem}
        keyExtractor={item => item.id}
        style={styles.songsList}
        contentContainerStyle={styles.songsListContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome5 name="music" size={40} color="#8A2BE2" />
            <Text style={styles.emptyStateText}>No songs yet</Text>
            <Text style={styles.emptyStateSubText}>
              Add songs to start listening
            </Text>
          </View>
        }
      />
      
      {/* Add button */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 20,
    padding: 5,
  },
  playlistInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  playlistCover: {
    width: 180,
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  playlistDescription: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  playlistMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistMetaText: {
    fontSize: 12,
    color: '#AAA',
  },
  playlistActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginRight: 10,
  },
  shuffleText: {
    marginLeft: 5,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  pauseButton: {
    backgroundColor: '#9932CC',
  },
  playText: {
    marginLeft: 5,
    fontWeight: '600',
    color: '#FFF',
  },
  songsList: {
    flex: 1,
    backgroundColor: '#000',
  },
  songsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  songNumber: {
    width: 25,
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginLeft: 10,
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 3,
  },
  songArtist: {
    fontSize: 14,
    color: '#AAA',
  },
  songDuration: {
    fontSize: 14,
    color: '#AAA',
    marginRight: 10,
  },
  moreButton: {
    padding: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#AAA',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default PlaylistView;