import React, { useState, useEffect } from 'react';
import { reviewsAPI, moviesAPI, isAuthenticated, getUserData, handleAPIError } from './api';
import { useNavigate } from 'react-router-dom';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [userReview, setUserReview] = useState({ rating: 0, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ movieTitle: '', rating: 0, comment: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedMovieDetails, setSelectedMovieDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMovies();
    loadReviews();
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await moviesAPI.getAllMovies();
      setMovies(result.movies || []);
    } catch (error) {
      console.error('Error loading movies:', error);
      const userFriendlyError = handleAPIError(error);
      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await reviewsAPI.getAllReviews();
      setReviews(result.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      const userFriendlyError = handleAPIError(error);
      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  const searchMovies = async (query) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await moviesAPI.searchMovies(query);
      
      if (result.success) {
        setSearchResults(result.movies);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search movies');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovieDetails = async (movieId) => {
    try {
      const result = await moviesAPI.getMovieDetails(movieId);
      
      if (result.success) {
        setSelectedMovieDetails(result.movie);
      }
    } catch (error) {
      console.error('Fetch movie details error:', error);
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();

    if (!newReview.movieTitle.trim()) {
      setError('Please provide a movie title');
      return;
    }

    if (newReview.rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!newReview.comment.trim()) {
      setError('Please provide a comment');
      return;
    }

    const reviewData = {
      movieTitle: newReview.movieTitle.trim(),
      rating: parseInt(newReview.rating),
      comment: newReview.comment.trim()
    };

    console.log('🎯 Creating review with data:', reviewData);

    try {
      const result = await reviewsAPI.createReview(reviewData);

      setReviews(prev => [result.review, ...prev]);
      setNewReview({ movieTitle: '', rating: 0, comment: '' });
      setShowReviewForm(false);
      setError('');
      setSuccessMessage('Review created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating review:', error);
      const userFriendlyError = handleAPIError(error);
      setError(userFriendlyError);
    }
  };

  // FIXED: submitMovieReview - Proper movie selection handling
  const submitMovieReview = async () => {
    console.log('🔍 DEBUG: submitMovieReview called');
    console.log('🔍 DEBUG: selectedMovie:', selectedMovie);
    console.log('🔍 DEBUG: userReview:', userReview);

    // Check if movie is properly selected
    if (!selectedMovie) {
      console.error('❌ DEBUG: No movie selected');
      setError('Please select a movie first by clicking on a movie card');
      return;
    }

    if (!selectedMovie.id || !selectedMovie.title) {
      console.error('❌ DEBUG: Invalid movie data:', selectedMovie);
      setError('Invalid movie selection. Please try again.');
      return;
    }

    if (userReview.rating === 0) {
      console.error('❌ DEBUG: Rating is 0');
      setError('Please select a rating');
      return;
    }

    if (!userReview.comment || !userReview.comment.trim()) {
      console.error('❌ DEBUG: Comment is empty:', userReview.comment);
      setError('Please provide a comment');
      return;
    }

    // Prepare review data with both movieId and movieTitle
    const reviewData = {
      movieId: selectedMovie.id,
      movieTitle: selectedMovie.title,
      rating: userReview.rating,
      comment: userReview.comment.trim()
    };

    console.log('🎯 DEBUG: Submitting review data:', reviewData);

    try {
      const result = await reviewsAPI.createReview(reviewData);

      setReviews(prev => [result.review, ...prev]);
      setUserReview({ rating: 0, comment: '' });
      setError('');
      setSuccessMessage('Review submitted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setSelectedMovie(null);
      setSelectedMovieDetails(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      const userFriendlyError = handleAPIError(error);
      setError(userFriendlyError);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await reviewsAPI.deleteReview(reviewId);
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      setSuccessMessage('Review deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting review:', error);
      const userFriendlyError = handleAPIError(error);
      setError(userFriendlyError);
    }
  };

  const handleUpdateReview = async (reviewId, updatedData) => {
    try {
      const result = await reviewsAPI.updateReview(reviewId, updatedData);
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? result.review : review
      ));
      setError('');
      setSuccessMessage('Review updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating review:', error);
      const userFriendlyError = handleAPIError(error);
      setError(userFriendlyError);
    }
  };

  const handleViewMyReviews = () => {
    if (!isAuthenticated()) {
      setError('Please log in to view your reviews');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    navigate('/my-reviews');
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${readonly ? 'readonly' : ''}`}
            onClick={() => !readonly && onRatingChange && onRatingChange(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Get reviews for a specific movie
  const getMovieReviews = (movieId) => {
    return reviews.filter(review => review.movieId === movieId);
  };

  // Calculate average rating for a movie
  const getAverageRating = (movieId) => {
    const movieReviews = getMovieReviews(movieId);
    if (movieReviews.length === 0) return 0;
    const total = movieReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / movieReviews.length).toFixed(1);
  };

  const currentUser = getUserData();

  if (loading) {
    return (
      <div className="movies-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="movies-container">
      {/* Header */}
      <div className="movies-header">
        <h1>🎬 Movie Collection</h1>
        <p>Discover amazing movies and share your reviews</p>
        
        {/* Search Section */}
        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchMovies(searchQuery)}
              className="search-input"
            />
            <button 
              onClick={() => searchMovies(searchQuery)}
              className="search-btn"
            >
              🔍 Search
            </button>
            {showSearchResults && (
              <button 
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchQuery('');
                }}
                className="show-all-btn"
              >
                Show All Movies
              </button>
            )}
          </div>
        </div>
        
        <div className="movies-actions">
          {isAuthenticated() && (
            <>
              <button 
                onClick={() => setShowReviewForm(true)}
                className="add-review-btn"
              >
                + Add Review
              </button>
              <button 
                onClick={handleViewMyReviews}
                className="my-reviews-btn"
              >
                📝 My Reviews
              </button>
            </>
          )}
          <button onClick={() => { loadMovies(); loadReviews(); }} className="refresh-btn">
            🔄 Refresh All
          </button>
        </div>
      </div>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="success-message">
          ✅ {successMessage}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Add Review Form Modal */}
      {showReviewForm && (
        <div className="modal-overlay" onClick={() => setShowReviewForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn"
              onClick={() => setShowReviewForm(false)}
            >
              ×
            </button>
            
            <h2>Add New Review</h2>
            <form onSubmit={handleCreateReview} className="review-form">
              <div className="form-group">
                <label>Movie Title *</label>
                <input
                  type="text"
                  value={newReview.movieTitle}
                  onChange={(e) => setNewReview(prev => ({ ...prev, movieTitle: e.target.value }))}
                  placeholder="Enter movie title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Your Rating *</label>
                <StarRating 
                  rating={newReview.rating}
                  onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                />
                <span className="rating-text">
                  {newReview.rating > 0 ? `${newReview.rating} stars` : 'Select rating'}
                </span>
              </div>
              
              <div className="form-group">
                <label>Review Comment *</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your thoughts about this movie..."
                  rows="4"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Submit Review
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowReviewForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movies Grid */}
      <div className="movies-grid">
        {(showSearchResults ? searchResults : movies).map(movie => (
          <div 
            key={movie.id} 
            className="movie-card"
            onClick={() => {
              console.log('🎬 Movie clicked:', movie.title, 'ID:', movie.id);
              setSelectedMovie(movie);
              fetchMovieDetails(movie.id);
            }}
          >
            <div 
              className="movie-poster"
              style={{ 
                backgroundImage: `url(${movie.posterPath})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="movie-overlay">
                <div className="movie-rating">
                  <span className="rating-star">⭐</span>
                  {movie.imdbRating || getAverageRating(movie.id) || 'N/A'}
                </div>
                {movie.year && (
                  <div className="movie-year-badge">
                    {movie.year}
                  </div>
                )}
              </div>
            </div>
            <div className="movie-info">
              <h3 className="movie-title">{movie.title}</h3>
              <p className="movie-year">{movie.year}</p>
              {movie.genres && movie.genres.length > 0 && (
                <p className="movie-genres">
                  {movie.genres.slice(0, 2).join(', ')}
                  {movie.genres.length > 2 && '...'}
                </p>
              )}
              {movie.director && (
                <p className="movie-director">
                  Director: {movie.director.split(',')[0]}
                </p>
              )}
              <div className="movie-actions">
                <button 
                  className="review-btn"
                  onClick={(e) => {
                    console.log('✏️ Write Review clicked for:', movie.title, 'ID:', movie.id);
                    e.stopPropagation(); // Prevent triggering the card click
                    setSelectedMovie(movie);
                    setUserReview({ rating: 0, comment: '' });
                    fetchMovieDetails(movie.id);
                  }}
                >
                  Write Review
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Movie Details Modal - Only show when a movie is selected */}
      {selectedMovie && (
        <div className="modal-overlay" onClick={() => {
          setSelectedMovie(null);
          setSelectedMovieDetails(null);
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn"
              onClick={() => {
                setSelectedMovie(null);
                setSelectedMovieDetails(null);
              }}
            >
              ×
            </button>

            <div 
              className="movie-backdrop"
              style={{ 
                backgroundImage: `url(${selectedMovie.posterPath})` 
              }}
            >
              <div className="backdrop-overlay">
                <h2>{selectedMovie.title}</h2>
                <p className="movie-meta">
                  {selectedMovie.releaseDate && new Date(selectedMovie.releaseDate).getFullYear()} • 
                  {selectedMovie.runtime ? ` ${selectedMovie.runtime} min • ` : ' • '}
                  {selectedMovie.genres ? (
                    Array.isArray(selectedMovie.genres) 
                      ? selectedMovie.genres.join(', ')
                      : selectedMovie.genres
                  ) : 'Unknown'}
                </p>
                <div className="average-rating">
                  <span className="rating-star">⭐</span>
                  Average Rating: {getAverageRating(selectedMovie.id) || 'No ratings yet'}
                  <span className="review-count">
                    ({getMovieReviews(selectedMovie.id).length} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="movie-details">
              {/* Enhanced Movie Details from OMDb */}
              {selectedMovieDetails && (
                <div className="details-section">
                  <h3>Movie Details</h3>
                  <div className="movie-meta-grid">
                    {selectedMovieDetails.imdbRating && (
                      <div className="meta-item">
                        <strong>IMDb Rating:</strong> ⭐ {selectedMovieDetails.imdbRating}/10
                      </div>
                    )}
                    {selectedMovieDetails.director && (
                      <div className="meta-item">
                        <strong>Director:</strong> {selectedMovieDetails.director}
                      </div>
                    )}
                    {selectedMovieDetails.actors && (
                      <div className="meta-item">
                        <strong>Cast:</strong> {selectedMovieDetails.actors}
                      </div>
                    )}
                    {selectedMovieDetails.boxOffice && (
                      <div className="meta-item">
                        <strong>Box Office:</strong> {selectedMovieDetails.boxOffice}
                      </div>
                    )}
                    {selectedMovieDetails.awards && (
                      <div className="meta-item">
                        <strong>Awards:</strong> {selectedMovieDetails.awards}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="details-section">
                <h3>Overview</h3>
                <p>{selectedMovie.overview || 'No overview available.'}</p>
              </div>

              {/* Review Section */}
              <div className="review-section">
                <h3>Write a Review</h3>
                {!isAuthenticated() ? (
                  <div className="login-prompt">
                    <p>Please log in to write a review.</p>
                    <button 
                      onClick={() => navigate('/login')}
                      className="login-btn"
                    >
                      Log In
                    </button>
                  </div>
                ) : (
                  <div className="review-form">
                    <div className="rating-input">
                      <label>Your Rating: *</label>
                      <StarRating
                        rating={userReview.rating}
                        onRatingChange={(rating) => {
                          console.log('⭐ Rating changed to:', rating);
                          setUserReview(prev => ({ ...prev, rating }));
                        }}
                      />
                      <span className="rating-text">
                        {userReview.rating > 0 ? `${userReview.rating} stars` : 'Select rating'}
                      </span>
                    </div>
                    <div className="form-group">
                      <label>Your Comment: *</label>
                      <textarea
                        placeholder="Share your thoughts about this movie... What did you like? What could be better?"
                        value={userReview.comment}
                        onChange={(e) => {
                          console.log('💬 Comment changed:', e.target.value);
                          setUserReview(prev => ({ ...prev, comment: e.target.value }));
                        }}
                        className="review-textarea"
                        rows="4"
                        required
                      />
                    </div>
                    <button
                      onClick={submitMovieReview}
                      disabled={userReview.rating === 0 || !userReview.comment.trim()}
                      className="submit-review-btn"
                    >
                      Submit Review
                    </button>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="reviews-list">
                <h3>User Reviews ({getMovieReviews(selectedMovie.id).length})</h3>
                {getMovieReviews(selectedMovie.id).length === 0 ? (
                  <p className="no-reviews">No reviews yet. Be the first to review this movie!</p>
                ) : (
                  getMovieReviews(selectedMovie.id).map(review => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <span className="reviewer-name">{review.userName}</span>
                          <StarRating rating={review.rating} readonly={true} />
                        </div>
                        <span className="review-date">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      {(currentUser && review.userId === currentUser.id) && (
                        <div className="review-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => {
                              const newComment = prompt('Edit your comment:', review.comment);
                              if (newComment !== null) {
                                handleUpdateReview(review.id, { ...review, comment: newComment });
                              }
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Reviews Section */}
      <div className="reviews-section">
        <div className="section-header">
          <h2>All Movie Reviews</h2>
          {isAuthenticated() && (
            <button 
              onClick={handleViewMyReviews}
              className="view-my-reviews-btn"
            >
              View My Reviews
            </button>
          )}
        </div>
        <div className="reviews-grid">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <h3 className="movie-title">{review.movieTitle}</h3>
                <div className="review-rating">
                  <StarRating rating={review.rating} readonly={true} />
                  <span className="rating-value">{review.rating}/5</span>
                </div>
              </div>
              
              <div className="review-content">
                <p className="review-comment">
                  {review.comment || <em>No comment provided.</em>}
                </p>
              </div>
              
              <div className="review-footer">
                <div className="reviewer-info">
                  <span className="reviewer-name">By {review.userName}</span>
                  <span className="review-date">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
                
                {(currentUser && review.userId === currentUser.id) && (
                  <div className="review-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => {
                        const newComment = prompt('Edit your comment:', review.comment);
                        if (newComment !== null) {
                          handleUpdateReview(review.id, { ...review, comment: newComment });
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="no-reviews">
            <div className="no-reviews-icon">🎬</div>
            <h3>No Reviews Yet</h3>
            <p>Be the first to share your movie review!</p>
            {!isAuthenticated() && (
              <button 
                onClick={() => navigate('/login')}
                className="login-btn"
              >
                Log in to Start Reviewing
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;