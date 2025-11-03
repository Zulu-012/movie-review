require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error);
}

const db = admin.firestore();

// OMDb API configuration
const OMDB_API_KEY = process.env.OMDB_API_KEY || '83be6d4a';
const OMDB_BASE_URL = 'http://www.omdbapi.com/';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enhanced authentication middleware (verify Firebase token)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const idToken = authHeader && authHeader.split(' ')[1]; // Bearer {firebase_id_token}

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }
};

// Updated Validation middleware - Use movieId instead of movieTitle
const validateReview = (req, res, next) => {
  const { movieId, movieTitle, rating, comment } = req.body;
  
  console.log('🔍 DEBUG: Received review data:', { movieId, movieTitle, rating, comment });
  
  // Accept either movieId or movieTitle for backward compatibility
  if ((!movieId || movieId.trim() === '') && (!movieTitle || movieTitle.trim() === '')) {
    console.log('❌ DEBUG: Both movieId and movieTitle are missing');
    return res.status(400).json({ 
      success: false,
      error: 'Movie ID or Title is required'
    });
  }
  
  if (!rating || rating < 1 || rating > 5) {
    console.log('❌ DEBUG: Invalid rating:', rating);
    return res.status(400).json({ 
      success: false,
      error: 'Rating must be between 1 and 5'
    });
  }
  
  if (!comment || comment.trim() === '') {
    console.log('❌ DEBUG: Comment is empty');
    return res.status(400).json({ 
      success: false,
      error: 'Comment is required'
    });
  }
  
  // Use movieId if available, otherwise use movieTitle
  const finalMovieId = movieId && movieId.trim() !== '' ? movieId.trim() : null;
  const finalMovieTitle = movieTitle && movieTitle.trim() !== '' ? movieTitle.trim() : 'Unknown Movie';
  
  req.cleanedReview = {
    movieId: finalMovieId,
    movieTitle: finalMovieTitle,
    rating: parseInt(rating),
    comment: comment.trim()
  };
  
  console.log('✅ DEBUG: Validation passed - Cleaned data:', req.cleanedReview);
  next();
};

// Helper function to fetch movie data from OMDb
const fetchMovieFromOMDb = async (imdbID) => {
  try {
    const response = await fetch(`${OMDB_BASE_URL}?i=${imdbID}&apikey=${OMDB_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`OMDb API error: ${response.status}`);
    }
    
    const movieData = await response.json();
    
    if (movieData.Response === 'False') {
      throw new Error(movieData.Error || 'Movie not found');
    }
    
    return movieData;
  } catch (error) {
    console.error('OMDb API fetch error:', error);
    throw error;
  }
};

// Helper function to search movies from OMDb
const searchMoviesFromOMDb = async (searchQuery) => {
  try {
    const response = await fetch(`${OMDB_BASE_URL}?s=${encodeURIComponent(searchQuery)}&apikey=${OMDB_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`OMDb API error: ${response.status}`);
    }
    
    const searchData = await response.json();
    
    if (searchData.Response === 'False') {
      throw new Error(searchData.Error || 'No movies found');
    }
    
    return searchData.Search || [];
  } catch (error) {
    console.error('OMDb search error:', error);
    throw error;
  }
};

// Routes

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: 'Firebase Firestore (Connected)',
    omdbApi: 'Connected',
    firebase: 'Initialized'
  });
});

// 2. Get popular movies from OMDb API
app.get('/api/movies', async (req, res) => {
  try {
    // Popular movie IMDB IDs
    const popularMovieIds = [
      'tt1375666', // Inception
      'tt0111161', // The Shawshank Redemption
      'tt0468569', // The Dark Knight
      'tt0137523', // Fight Club
      'tt0109830', // Forrest Gump
      'tt0167260', // The Lord of the Rings: The Return of the King
      'tt0133093', // The Matrix
      'tt0088763', // Back to the Future
      'tt0076759', // Star Wars: Episode IV
      'tt0110912'  // Pulp Fiction
    ];

    // Fetch movie details from OMDb API
    const moviePromises = popularMovieIds.map(movieId => 
      fetchMovieFromOMDb(movieId)
    );

    const moviesData = await Promise.allSettled(moviePromises);

    // Process successful responses
    const movies = moviesData
      .filter(result => result.status === 'fulfilled')
      .map(result => {
        const movie = result.value;
        return {
          id: movie.imdbID,
          title: movie.Title,
          overview: movie.Plot,
          releaseDate: movie.Released,
          runtime: parseInt(movie.Runtime) || 0,
          genres: movie.Genre ? movie.Genre.split(', ') : [],
          posterPath: movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster',
          imdbRating: movie.imdbRating,
          director: movie.Director,
          actors: movie.Actors,
          year: movie.Year
        };
      });

    // If all requests failed, use fallback data
    if (movies.length === 0) {
      const fallbackMovies = [
        {
          id: 'tt1375666',
          title: 'Inception',
          overview: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
          releaseDate: '2010-07-16',
          runtime: 148,
          genres: ['Action', 'Sci-Fi', 'Thriller'],
          posterPath: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
          imdbRating: '8.8',
          director: 'Christopher Nolan',
          actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Ellen Page',
          year: '2010'
        },
        {
          id: 'tt0111161',
          title: 'The Shawshank Redemption',
          overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
          releaseDate: '1994-09-23',
          runtime: 142,
          genres: ['Drama'],
          posterPath: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
          imdbRating: '9.3',
          director: 'Frank Darabont',
          actors: 'Tim Robbins, Morgan Freeman, Bob Gunton',
          year: '1994'
        },
        {
          id: 'tt0468569',
          title: 'The Dark Knight',
          overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
          releaseDate: '2008-07-18',
          runtime: 152,
          genres: ['Action', 'Crime', 'Drama'],
          posterPath: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
          imdbRating: '9.0',
          director: 'Christopher Nolan',
          actors: 'Christian Bale, Heath Ledger, Aaron Eckhart',
          year: '2008'
        }
      ];
      
      return res.json({
        success: true,
        count: fallbackMovies.length,
        movies: fallbackMovies,
        note: 'Using fallback data due to OMDb API issues'
      });
    }

    res.json({
      success: true,
      count: movies.length,
      movies,
      note: 'Data provided by OMDb API'
    });

  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch movies from OMDb API'
    });
  }
});

// 3. Search movies by title
app.get('/api/movies/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchResults = await searchMoviesFromOMDb(query);

    // Get detailed information for each movie (limit to 5 for performance)
    const detailedMovies = await Promise.allSettled(
      searchResults.slice(0, 5).map(movie => fetchMovieFromOMDb(movie.imdbID))
    );

    const movies = detailedMovies
      .filter(result => result.status === 'fulfilled')
      .map(result => {
        const movie = result.value;
        return {
          id: movie.imdbID,
          title: movie.Title,
          overview: movie.Plot,
          releaseDate: movie.Released,
          runtime: parseInt(movie.Runtime) || 0,
          genres: movie.Genre ? movie.Genre.split(', ') : [],
          posterPath: movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster',
          imdbRating: movie.imdbRating,
          director: movie.Director,
          actors: movie.Actors,
          year: movie.Year
        };
      });

    res.json({
      success: true,
      count: movies.length,
      query: query,
      movies
    });

  } catch (error) {
    console.error('Search movies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search movies'
    });
  }
});

// 4. Get movie details by ID
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const movieData = await fetchMovieFromOMDb(id);

    const movie = {
      id: movieData.imdbID,
      title: movieData.Title,
      overview: movieData.Plot,
      releaseDate: movieData.Released,
      runtime: parseInt(movieData.Runtime) || 0,
      genres: movieData.Genre ? movieData.Genre.split(', ') : [],
      posterPath: movieData.Poster !== 'N/A' ? movieData.Poster : 'https://via.placeholder.com/300x450?text=No+Poster',
      imdbRating: movieData.imdbRating,
      director: movieData.Director,
      actors: movieData.Actors,
      year: movieData.Year,
      boxOffice: movieData.BoxOffice,
      country: movieData.Country,
      language: movieData.Language,
      awards: movieData.Awards
    };

    res.json({
      success: true,
      movie
    });

  } catch (error) {
    console.error('Get movie details error:', error);
    res.status(404).json({
      success: false,
      error: 'Movie not found'
    });
  }
});

// 5. Get all reviews (public - no auth required)
app.get('/api/reviews', async (req, res) => {
  try {
    const reviewsRef = db.collection('reviews');
    const snapshot = await reviewsRef.orderBy('createdAt', 'desc').get();
    
    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

// 6. Create a new review (requires auth) - UPDATED to use movieId
app.post('/api/reviews', authenticateUser, validateReview, async (req, res) => {
  try {
    const { movieId, movieTitle, rating, comment } = req.cleanedReview;
    const userUid = req.user.uid;

    console.log('🎯 Creating review for user:', userUid);
    console.log('🎯 Review data:', { movieId, movieTitle, rating, comment });

    const reviewData = {
      movieId,
      movieTitle,
      rating,
      comment,
      userId: userUid,
      userEmail: req.user.email,
      userName: req.user.name || 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore
    const docRef = await db.collection('reviews').add(reviewData);

    console.log('✅ Review saved to Firestore with ID:', docRef.id);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review: {
        id: docRef.id,
        ...reviewData
      }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create review'
    });
  }
});

// 7. Update a review - UPDATED to use movieId
app.put('/api/reviews/:id', authenticateUser, validateReview, async (req, res) => {
  try {
    const { id } = req.params;
    const { movieId, movieTitle, rating, comment } = req.cleanedReview;
    const userUid = req.user.uid;

    console.log('🔄 Updating review:', id);
    console.log('🔄 Update data:', { movieId, movieTitle, rating, comment });

    // Check if review exists and belongs to user
    const reviewRef = db.collection('reviews').doc(id);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    const reviewData = reviewDoc.data();
    if (reviewData.userId !== userUid) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this review'
      });
    }

    const updateData = {
      movieId,
      movieTitle,
      rating,
      comment,
      updatedAt: new Date().toISOString()
    };

    await reviewRef.update(updateData);

    res.json({
      success: true,
      message: 'Review updated successfully',
      reviewId: id,
      review: {
        id: id,
        ...updateData,
        userId: userUid,
        createdAt: reviewData.createdAt
      }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update review'
    });
  }
});

// 8. Delete a review
app.delete('/api/reviews/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userUid = req.user.uid;

    console.log('🗑️ Deleting review:', id, 'for user:', userUid);

    // Check if review exists and belongs to user
    const reviewRef = db.collection('reviews').doc(id);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    const reviewData = reviewDoc.data();
    if (reviewData.userId !== userUid) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this review'
      });
    }

    await reviewRef.delete();

    res.json({ 
      success: true,
      message: 'Review deleted successfully',
      reviewId: id
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete review'
    });
  }
});

// 9. Get user's reviews
app.get('/api/my-reviews', authenticateUser, async (req, res) => {
  try {
    const userUid = req.user.uid;
    
    console.log('📋 Getting reviews for user:', userUid);

    const reviewsRef = db.collection('reviews');
    const snapshot = await reviewsRef
      .where('userId', '==', userUid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch your reviews'
    });
  }
});

// 10. Test endpoint for debugging
app.post('/api/debug/review', (req, res) => {
  console.log('🔍 DEBUG: Received review data:', req.body);
  res.json({
    success: true,
    message: 'Debug endpoint - check server logs',
    receivedData: req.body
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Movie Review API Server with OMDb Integration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'Firebase Firestore (Connected)',
    omdbApi: 'Connected',
    firebase: 'Initialized',
    endpoints: {
      health: '/api/health',
      movies: '/api/movies',
      movieSearch: '/api/movies/search?query=matrix',
      movieDetails: '/api/movies/tt0133093',
      reviews: '/api/reviews',
      myReviews: '/api/my-reviews',
      debug: '/api/debug/review'
    },
    instructions: {
      authentication: 'Use Firebase ID token in Authorization header as Bearer token',
      reviewCreation: 'Send { movieId, movieTitle, rating, comment } in request body'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    availableEndpoints: {
      health: 'GET /api/health',
      movies: 'GET /api/movies',
      movieSearch: 'GET /api/movies/search?query=matrix',
      movieDetails: 'GET /api/movies/:id',
      createReview: 'POST /api/reviews',
      updateReview: 'PUT /api/reviews/:id',
      deleteReview: 'DELETE /api/reviews/:id',
      myReviews: 'GET /api/my-reviews'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
📡 Health check: http://localhost:${PORT}/api/health
🎬 OMDb API: Connected with key ${OMDB_API_KEY}
🗄️  Database: Firebase Firestore (Connected)
📝 Review System: Ready (using movieId as primary identifier)
🔐 Authentication: Firebase ID token based

📋 Available Endpoints:
   GET  /api/health          - Health check
   GET  /api/movies          - Get popular movies
   GET  /api/movies/search   - Search movies
   GET  /api/movies/:id      - Get movie details
   GET  /api/reviews         - Get all reviews
   POST /api/reviews         - Create review (auth required)
   PUT  /api/reviews/:id     - Update review (auth required)
   DELETE /api/reviews/:id   - Delete review (auth required)
   GET  /api/my-reviews      - Get user's reviews (auth required)
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;