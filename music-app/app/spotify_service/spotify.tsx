import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../api-config/spotify';

// Base URLs
const AUTH_URL = 'https://accounts.spotify.com/api/token';
const API_URL = 'https://api.spotify.com/v1';

// Get access token using client credentials flow
const getAccessToken = async () => {
  try {
    // Check if we have a cached token that's not expired
    const tokenData = await AsyncStorage.getItem('spotifyToken');
    
    if (tokenData) {
      const parsedToken = JSON.parse(tokenData);
      const currentTime = Date.now();
      
      // If token is still valid (with 60s buffer), return it
      if (parsedToken.expiresAt > currentTime + 60000) {
        return parsedToken.access_token;
      }
    }
    
    // We need a new token
    const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to get Spotify token: ${data.error}`);
    }
    
    // Calculate expiry time and store token
    const expiresAt = Date.now() + (data.expires_in * 1000);
    const tokenToStore = {
      access_token: data.access_token,
      expiresAt
    };
    
    await AsyncStorage.setItem('spotifyToken', JSON.stringify(tokenToStore));
    return data.access_token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // Handle 404 Not Found errors specifically
    if (response.status === 404) {
      console.warn(`Endpoint not found: ${endpoint}`);
      // Return empty data structure instead of throwing error
      return { items: [], playlists: { items: [] }, albums: { items: [] }, artists: { items: [] }, tracks: { items: [] } };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${data.error?.message || data.error || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error in Spotify API request to ${endpoint}:`, error);
    throw error;
  }
};

// Get featured playlists - Modified to include fallback data
export const getFeaturedPlaylists = async (limit = 10) => {
  try {
    const data = await apiRequest(`/browse/featured-playlists?limit=${limit}`);
    
    // If we have actual API data, use it
    if (data.playlists?.items?.length > 0) {
      return data.playlists.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        songs: item.tracks?.total || 0,
        cover: item.images[0]?.url,
        owner: item.owner.display_name,
        isPublic: !item.public
      }));
    }
    
    // If API failed or returned empty, use fallback data
    return [
      {
        id: 'fallback_playlist_1',
        name: "Today's Hits",
        description: 'The most popular songs right now',
        songs: 50,
        cover: 'https://placehold.co/300x300/8A2BE2/FFF?text=Popular',
        owner: 'Spotify',
        isPublic: true
      },
      {
        id: 'fallback_playlist_2',
        name: 'Chill Vibes',
        description: 'Relaxing tunes to unwind',
        songs: 45,
        cover: 'https://placehold.co/300x300/4169E1/FFF?text=Chill',
        owner: 'Spotify',
        isPublic: true
      },
      {
        id: 'fallback_playlist_3',
        name: 'Workout Mix',
        description: 'Energy boosting tracks for your exercise',
        songs: 40,
        cover: 'https://placehold.co/300x300/FF4500/FFF?text=Workout',
        owner: 'Spotify',
        isPublic: true
      },
      {
        id: 'fallback_playlist_4',
        name: 'Hip Hop Essentials',
        description: 'Classic and current hip hop tracks',
        songs: 55,
        cover: 'https://placehold.co/300x300/FFD700/000?text=HipHop',
        owner: 'Spotify',
        isPublic: true
      }
    ].slice(0, limit);
  } catch (error) {
    console.error('Error getting featured playlists:', error);
    // Return fallback data on error
    return [
      {
        id: 'fallback_playlist_1',
        name: "Today's Hits",
        description: 'The most popular songs right now',
        songs: 50,
        cover: 'https://placehold.co/300x300/8A2BE2/FFF?text=Popular',
        owner: 'Spotify',
        isPublic: true
      },
      {
        id: 'fallback_playlist_2',
        name: 'Chill Vibes',
        description: 'Relaxing tunes to unwind',
        songs: 45,
        cover: 'https://placehold.co/300x300/4169E1/FFF?text=Chill',
        owner: 'Spotify',
        isPublic: true
      },
      {
        id: 'fallback_playlist_3',
        name: 'Workout Mix',
        description: 'Energy boosting tracks for your exercise',
        songs: 40,
        cover: 'https://placehold.co/300x300/FF4500/FFF?text=Workout',
        owner: 'Spotify',
        isPublic: true
      },
      {
        id: 'fallback_playlist_4',
        name: 'Hip Hop Essentials',
        description: 'Classic and current hip hop tracks',
        songs: 55,
        cover: 'https://placehold.co/300x300/FFD700/000?text=HipHop',
        owner: 'Spotify',
        isPublic: true
      }
    ].slice(0, limit);
  }
};

// Get playlist details including tracks - Modified with error handling
export const getPlaylistDetails = async (playlistId) => {
  try {
    // If it's a fallback playlist ID, return mock data
    if (playlistId.startsWith('fallback_playlist_')) {
      return generateFallbackPlaylistDetails(playlistId);
    }
    
    const data = await apiRequest(`/playlists/${playlistId}`);
    
    const tracks = data.tracks?.items?.map(item => ({
      id: item.track?.id || `track_${Math.random().toString(36).substr(2, 9)}`,
      title: item.track?.name || 'Unknown Track',
      artist: item.track?.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist',
      duration: item.track?.duration_ms ? msToMinSec(item.track.duration_ms) : '0:00',
      cover: item.track?.album?.images?.[0]?.url || 'https://placehold.co/300x300/8A2BE2/FFF?text=Track',
      uri: item.track?.uri || '',
      previewUrl: item.track?.preview_url || ''
    })) || [];
    
    return {
      id: data.id || playlistId,
      name: data.name || 'Playlist',
      description: data.description || '',
      coverImage: data.images?.[0]?.url || 'https://placehold.co/300x300/8A2BE2/FFF?text=Playlist',
      songs: tracks,
      owner: data.owner?.display_name || 'Unknown',
      isPublic: data.public !== undefined ? !data.public : true,
      createdAt: data.followers ? new Date().toISOString() : undefined
    };
  } catch (error) {
    console.error(`Error fetching playlist details for ${playlistId}:`, error);
    return generateFallbackPlaylistDetails(playlistId);
  }
};

// Get recently played tracks from local storage
export const getRecentSongs = async () => {
  try {
    const recentSongsString = await AsyncStorage.getItem('recentSongs');
    return recentSongsString ? JSON.parse(recentSongsString) : [];
  } catch (error) {
    console.error('Error getting recent songs:', error);
    return [];
  }
};

// Helper function to generate fallback playlist details
const generateFallbackPlaylistDetails = (playlistId) => {
  let name, description, coverImage, songs;
  
  switch(playlistId) {
    case 'fallback_playlist_1':
      name = "Today's Hits";
      description = 'The most popular songs right now';
      coverImage = 'https://placehold.co/300x300/8A2BE2/FFF?text=Popular';
      songs = generateMockSongs(10, 'Pop');
      break;
    case 'fallback_playlist_2':
      name = 'Chill Vibes';
      description = 'Relaxing tunes to unwind';
      coverImage = 'https://placehold.co/300x300/4169E1/FFF?text=Chill';
      songs = generateMockSongs(8, 'Chill');
      break;
    case 'fallback_playlist_3':
      name = 'Workout Mix';
      description = 'Energy boosting tracks for your exercise';
      coverImage = 'https://placehold.co/300x300/FF4500/FFF?text=Workout';
      songs = generateMockSongs(12, 'EDM');
      break;
    case 'fallback_playlist_4':
      name = 'Hip Hop Essentials';
      description = 'Classic and current hip hop tracks';
      coverImage = 'https://placehold.co/300x300/FFD700/000?text=HipHop';
      songs = generateMockSongs(15, 'Hip Hop');
      break;
    default:
      name = 'Playlist';
      description = 'Playlist description';
      coverImage = 'https://placehold.co/300x300/8A2BE2/FFF?text=Playlist';
      songs = generateMockSongs(5, 'Mixed');
  }
  
  return {
    id: playlistId,
    name,
    description,
    coverImage,
    songs,
    owner: 'Spotify',
    isPublic: true,
    createdAt: new Date().toISOString()
  };
};

// Helper function to generate mock songs
const generateMockSongs = (count, genre) => {
  const genres = {
    'Pop': {
      artists: ['Taylor Swift', 'Ed Sheeran', 'Ariana Grande', 'Justin Bieber', 'Billie Eilish'],
      titles: ['Summer Nights', 'Dancing in the Dark', 'Perfect Day', 'Midnight Sky', 'Golden Hour']
    },
    'Rock': {
      artists: ['Foo Fighters', 'Arctic Monkeys', 'The Killers', 'Imagine Dragons', 'Twenty One Pilots'],
      titles: ['High Voltage', 'Stone Cold', 'Burning Bridges', 'Rising Star', 'Heavy Crown']
    },
    'Hip Hop': {
      artists: ['Drake', 'Kendrick Lamar', 'J. Cole', 'Travis Scott', 'Cardi B'],
      titles: ['City Lights', 'Street Dreams', 'Money Moves', 'Real Talk', 'Fresh Prince']
    },
    'EDM': {
      artists: ['Calvin Harris', 'Marshmello', 'Avicii', 'David Guetta', 'Martin Garrix'],
      titles: ['Electric Soul', 'Bass Drop', 'Neon Nights', 'Club Paradise', 'Synthetic Heart']
    },
    'Chill': {
      artists: ['Bon Iver', 'Frank Ocean', 'Lana Del Rey', 'Tame Impala', 'Mac DeMarco'],
      titles: ['Ocean Breeze', 'Sunset Dreams', 'Mountain View', 'Calm Waters', 'Silent Echo']
    },
    'Mixed': {
      artists: ['Various Artists', 'Unknown Artist', 'The Band', 'Studio Musicians', 'DJ Mix'],
      titles: ['Untitled Track', 'New Song', 'Amazing Tune', 'Great Music', 'Cool Vibes']
    }
  };

  const genreData = genres[genre] || genres['Mixed'];
  
  return Array.from({ length: count }, (_, i) => {
    const artistIndex = Math.floor(Math.random() * genreData.artists.length);
    const titleIndex = Math.floor(Math.random() * genreData.titles.length);
    
    return {
      id: `mock_song_${i}`,
      title: `${genreData.titles[titleIndex]} ${i + 1}`,
      artist: genreData.artists[artistIndex],
      duration: `${Math.floor(Math.random() * 4) + 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      cover: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=${genre}`,
      uri: `spotify:track:mock_${i}`,
      previewUrl: ''
    };
  });
};

// Get random color for placeholder images
const getRandomColor = () => {
  const colors = ['8A2BE2', '4169E1', 'FF4500', 'FFD700', '32CD32', 'FF1493', '00CED1', 'FFA500'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Helper function to convert milliseconds to mm:ss format
const msToMinSec = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Get top artists - Completed with error handling
export const getTopArtists = async (limit = 10) => {
  try {
    const data = await apiRequest(`/browse/new-releases?limit=${limit}`);
    
    // Extract unique artists from new releases
    const artistsMap = new Map();
    
    if (data.albums?.items?.length > 0) {
      data.albums.items.forEach(album => {
        const artist = album.artists?.[0];
        if (artist && !artistsMap.has(artist.id)) {
          artistsMap.set(artist.id, {
            id: artist.id,
            name: artist.name,
            genre: album.genres?.[0] || 'Unknown',
            image: album.images?.[0]?.url
          });
        }
      });
      
      const artists = Array.from(artistsMap.values());
      if (artists.length > 0) {
        return artists.slice(0, limit);
      }
    }
    
    // Return fallback data if API returns no results
    return generateFallbackArtists(limit);
  } catch (error) {
    console.error('Error getting top artists:', error);
    return generateFallbackArtists(limit);
  }
};

// Helper function to generate fallback artists
const generateFallbackArtists = (limit = 10) => {
  const fallbackArtists = [
    {
      id: 'fallback_artist_1',
      name: 'The Weeknd',
      genre: 'R&B/Pop',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=TheWeeknd`
    },
    {
      id: 'fallback_artist_2',
      name: 'Taylor Swift',
      genre: 'Pop',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=TaylorSwift`
    },
    {
      id: 'fallback_artist_3',
      name: 'Drake',
      genre: 'Hip Hop',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=Drake`
    },
    {
      id: 'fallback_artist_4',
      name: 'Billie Eilish',
      genre: 'Pop',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=BillieEilish`
    },
    {
      id: 'fallback_artist_5',
      name: 'Bad Bunny',
      genre: 'Reggaeton',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=BadBunny`
    },
    {
      id: 'fallback_artist_6',
      name: 'Dua Lipa',
      genre: 'Pop',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=DuaLipa`
    },
    {
      id: 'fallback_artist_7',
      name: 'Kendrick Lamar',
      genre: 'Hip Hop',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=KendrickLamar`
    },
    {
      id: 'fallback_artist_8',
      name: 'Adele',
      genre: 'Pop/Soul',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=Adele`
    },
    {
      id: 'fallback_artist_9',
      name: 'Harry Styles',
      genre: 'Pop/Rock',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=HarryStyles`
    },
    {
      id: 'fallback_artist_10',
      name: 'BTS',
      genre: 'K-Pop',
      image: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=BTS`
    }
  ];
  
  return fallbackArtists.slice(0, limit);
};

// Search for tracks, artists, albums or playlists
export const searchSpotify = async (query, type = 'track,artist,album,playlist', limit = 20) => {
  if (!query || query.trim() === '') {
    return {
      tracks: [],
      artists: [],
      albums: [],
      playlists: []
    };
  }
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const data = await apiRequest(`/search?q=${encodedQuery}&type=${type}&limit=${limit}`);
    
    const results = {
      tracks: (data.tracks?.items || []).map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album?.name,
        duration: msToMinSec(track.duration_ms),
        cover: track.album?.images[0]?.url,
        uri: track.uri,
        previewUrl: track.preview_url
      })),
      
      artists: (data.artists?.items || []).map(artist => ({
        id: artist.id,
        name: artist.name,
        genre: artist.genres?.[0] || 'Unknown',
        image: artist.images?.[0]?.url,
        popularity: artist.popularity,
        uri: artist.uri
      })),
      
      albums: (data.albums?.items || []).map(album => ({
        id: album.id,
        name: album.name,
        artist: album.artists.map(artist => artist.name).join(', '),
        cover: album.images?.[0]?.url,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
        uri: album.uri
      })),
      
      playlists: (data.playlists?.items || []).map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        owner: playlist.owner?.display_name,
        cover: playlist.images?.[0]?.url,
        tracks: playlist.tracks?.total || 0,
        uri: playlist.uri
      }))
    };
    
    return results;
  } catch (error) {
    console.error('Error searching Spotify:', error);
    // Return empty results on error
    return {
      tracks: [],
      artists: [],
      albums: [],
      playlists: []
    };
  }
};

// Get artist details including top tracks
export const getArtistDetails = async (artistId) => {
  try {
    // If it's a fallback artist ID, return mock data
    if (artistId.startsWith('fallback_artist_')) {
      return generateFallbackArtistDetails(artistId);
    }
    
    // Make parallel requests for artist info and top tracks
    const [artistData, topTracksData, albumsData] = await Promise.all([
      apiRequest(`/artists/${artistId}`),
      apiRequest(`/artists/${artistId}/top-tracks?market=US`),
      apiRequest(`/artists/${artistId}/albums?limit=10&include_groups=album,single`)
    ]);
    
    // Process top tracks
    const topTracks = topTracksData.tracks?.map(track => ({
      id: track.id,
      title: track.name,
      album: track.album?.name,
      duration: msToMinSec(track.duration_ms),
      cover: track.album?.images?.[0]?.url,
      popularity: track.popularity,
      previewUrl: track.preview_url,
      uri: track.uri
    })) || [];
    
    // Process albums
    const albums = albumsData.items?.map(album => ({
      id: album.id,
      name: album.name,
      releaseDate: album.release_date,
      totalTracks: album.total_tracks,
      cover: album.images?.[0]?.url,
      uri: album.uri
    })) || [];
    
    return {
      id: artistData.id,
      name: artistData.name,
      genres: artistData.genres || [],
      popularity: artistData.popularity,
      followers: artistData.followers?.total,
      image: artistData.images?.[0]?.url,
      topTracks,
      albums
    };
  } catch (error) {
    console.error(`Error fetching artist details for ${artistId}:`, error);
    return generateFallbackArtistDetails(artistId);
  }
};

// Helper function to generate fallback artist details
const generateFallbackArtistDetails = (artistId) => {
  let name, genre, image;
  
  // Extract artist number from ID
  const artistNum = parseInt(artistId.split('_')[2]) || 1;
  const fallbackArtists = generateFallbackArtists(10);
  const artistIndex = (artistNum - 1) % fallbackArtists.length;
  
  // Get basic info from fallback artists list
  const artistInfo = fallbackArtists[artistIndex];
  name = artistInfo.name;
  genre = artistInfo.genre;
  image = artistInfo.image;
  
  // Generate mock top tracks
  const tracks = generateMockSongs(10, genre.split('/')[0]);
  const topTracks = tracks.map(track => ({
    id: track.id,
    title: track.title,
    album: `${name} - Greatest Hits`,
    duration: track.duration,
    cover: track.cover,
    popularity: Math.floor(Math.random() * 100),
    previewUrl: '',
    uri: track.uri
  }));
  
  // Generate mock albums
  const albums = Array.from({ length: 5 }, (_, i) => {
    const year = 2023 - i;
    return {
      id: `album_${artistId}_${i}`,
      name: i === 0 ? 'Latest Release' : `${name} Album ${i}`,
      releaseDate: `${year}-05-${Math.floor(Math.random() * 28) + 1}`,
      totalTracks: Math.floor(Math.random() * 12) + 8,
      cover: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=Album${i}`,
      uri: `spotify:album:mock_${artistId}_${i}`
    };
  });
  
  return {
    id: artistId,
    name,
    genres: genre.includes('/') ? genre.split('/') : [genre],
    popularity: Math.floor(Math.random() * 100),
    followers: Math.floor(Math.random() * 10000000) + 1000000,
    image,
    topTracks,
    albums
  };
};

// Get album details
export const getAlbumDetails = async (albumId) => {
  try {
    const data = await apiRequest(`/albums/${albumId}`);
    
    const tracks = data.tracks?.items?.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists?.map(artist => artist.name).join(', '),
      duration: msToMinSec(track.duration_ms),
      trackNumber: track.track_number,
      uri: track.uri,
      previewUrl: track.preview_url
    })) || [];
    
    return {
      id: data.id,
      name: data.name,
      artist: data.artists?.map(artist => artist.name).join(', '),
      artistId: data.artists?.[0]?.id,
      releaseDate: data.release_date,
      totalTracks: data.total_tracks,
      popularity: data.popularity,
      cover: data.images?.[0]?.url,
      genres: data.genres || [],
      tracks,
      uri: data.uri
    };
  } catch (error) {
    console.error(`Error fetching album details for ${albumId}:`, error);
    return generateFallbackAlbumDetails(albumId);
  }
};

// Helper function to generate fallback album details
const generateFallbackAlbumDetails = (albumId) => {
  // Extract artist info from album ID if possible
  const parts = albumId.split('_');
  let artistId = 'fallback_artist_1';
  
  if (parts.length >= 3 && parts[1].startsWith('fallback_artist')) {
    artistId = `${parts[1]}_${parts[2]}`;
  }
  
  // Get mock artist details
  const artistDetails = generateFallbackArtistDetails(artistId);
  
  // Generate tracks
  const trackCount = 10;
  const genre = artistDetails.genres?.[0] || 'Pop';
  const tracks = generateMockSongs(trackCount, genre).map((song, index) => ({
    ...song,
    artist: artistDetails.name,
    trackNumber: index + 1
  }));
  
  return {
    id: albumId,
    name: `${artistDetails.name} - Album`,
    artist: artistDetails.name,
    artistId: artistId,
    releaseDate: `${2020 + Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`,
    totalTracks: trackCount,
    popularity: Math.floor(Math.random() * 100),
    cover: `https://placehold.co/300x300/${getRandomColor()}/FFF?text=Album`,
    genres: artistDetails.genres,
    tracks,
    uri: `spotify:album:${albumId}`
  };
};

// Export all necessary functions
export default {
  getFeaturedPlaylists,
  getPlaylistDetails,
  getRecentSongs,
  getTopArtists,
  searchSpotify,
  getArtistDetails,
  getAlbumDetails
};
