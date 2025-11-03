// MyReviews.js - Updated to work with backend API
import React, { useState, useEffect } from 'react';
import { reviewsAPI, isAuthenticated, getUserData, handleAPIError } from './api';
import { useNavigate } from 'react-router-dom';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ movieTitle: '', rating: 0, comment: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadMyReviews();
  }, []);

  const loadMyReviews = async () => {
    if (!isAuthenticated()) {
      setError('Please log in to view your reviews');
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await reviewsAPI.getMyReviews();
      setReviews(result.reviews || []);
    } catch (error) {
      console.error('Error loading my reviews:', error);
      const userFriendlyError = handleAPIError(error);
      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      setError('');
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

  const updateReview = async (reviewId, updatedData) => {
    try {
      const result = await reviewsAPI.updateReview(reviewId, updatedData);
      setReviews(prev => prev.map(review =>
        review.id === reviewId ? result.review : review
      ));
      setSuccessMessage('Review updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating review:', error);
      const userFriendlyError = handleAPIError(error);
      setError(userFriendlyError);
    }
  };

  const refreshReviews = () => {
    setLoading(true);
    loadMyReviews();
  };

  const handleBackToMovies = () => {
    navigate('/movies');
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();

    // Validate required fields
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

    // Prepare review data
    const reviewData = {
      movieTitle: newReview.movieTitle.trim(),
      rating: parseInt(newReview.rating),
      comment: newReview.comment.trim()
    };

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

  const currentUser = getUserData();

  if (loading) {
    return (
      <div className="movies-container">
        <div className="loading">
          Loading your reviews...
        </div>
      </div>
    );
  }

  return (
    <div className="movies-container">
      <div className="movies-header">
        <h1>📝 My Reviews</h1>
        <p>View and manage all your movie reviews</p>

        <div className="movies-actions">
          {isAuthenticated() && (
            <>
              <button
                onClick={() => setShowReviewForm(true)}
                className="add-review-btn"
              >
                + Add Review
              </button>
            </>
          )}
          <button onClick={refreshReviews} className="refresh-btn">
            🔄 Refresh
          </button>
          <button onClick={handleBackToMovies} className="back-btn">
            ← Back to Movies
          </button>
          <span className="reviews-count">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

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

      <div className="reviews-grid">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <div className="no-reviews-icon">📝</div>
            <h3>No Reviews Yet</h3>
            <p>You haven't written any reviews yet.</p>
            <p>Start by exploring movies and share your thoughts!</p>
            <button 
              onClick={handleBackToMovies}
              className="suggestion-link"
            >
              🎬 Browse Movies
            </button>
          </div>
        ) : (
          reviews.map(review => (
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
                  <span className="review-date">
                    Reviewed on {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                  </span>
                  {review.updatedAt && review.updatedAt !== review.createdAt && (
                    <span className="updated-date">
                      Updated on {new Date(review.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="review-actions">
                  <button
                    className="edit-btn"
                    onClick={() => {
                      const newComment = prompt('Edit your comment:', review.comment);
                      if (newComment !== null) {
                        updateReview(review.id, {
                          movieTitle: review.movieTitle,
                          rating: review.rating,
                          comment: newComment
                        });
                      }
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteReview(review.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyReviews;