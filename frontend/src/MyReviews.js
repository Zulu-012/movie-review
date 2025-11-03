// MyReviews.js
import React, { useState, useEffect } from 'react';
import { reviewsAPI, isAuthenticated, getUserData, handleAPIError } from './api'; // Fixed import
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase-config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ movieTitle: '', rating: 0, comment: '' });
  const navigate = useNavigate();

  // Default reviews data
  const defaultReviews = [
    {
      id: 'default-1',
      movieTitle: 'Inception',
      rating: 5,
      comment: 'Mind-bending masterpiece with incredible visuals and a thought-provoking plot that keeps you engaged from start to finish.',
      userId: 'default-user-1',
      userName: 'MovieLover42',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'default-2',
      movieTitle: 'The Shawshank Redemption',
      rating: 5,
      comment: 'An absolute classic! Tim Robbins and Morgan Freeman deliver powerful performances in this inspiring story of hope and friendship.',
      userId: 'default-user-2',
      userName: 'CinemaFan',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: 'default-3',
      movieTitle: 'Spirited Away',
      rating: 4,
      comment: 'Beautiful animation and magical storytelling. Studio Ghibli at its finest, though some scenes might be intense for younger viewers.',
      userId: 'default-user-3',
      userName: 'AnimeEnthusiast',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05')
    },
    {
      id: 'default-4',
      movieTitle: 'The Dark Knight',
      rating: 5,
      comment: 'Heath Ledger\'s Joker performance alone makes this worth watching. A superhero movie that transcends the genre.',
      userId: 'default-user-4',
      userName: 'ComicBookGuy',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'default-5',
      movieTitle: 'Parasite',
      rating: 4,
      comment: 'Brilliant social commentary wrapped in a thrilling package. The class divide has never been more dramatically portrayed.',
      userId: 'default-user-5',
      userName: 'FilmCritic101',
      createdAt: new Date('2023-12-28'),
      updatedAt: new Date('2023-12-28')
    }
  ];

  useEffect(() => {
    loadAllReviews();
  }, []);

  const loadAllReviews = async () => {
    try {
      setError('');
      setLoading(true);
      // Load reviews from Firebase
      const reviewsCollection = collection(db, 'reviews');
      const reviewsQuery = query(reviewsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(reviewsQuery);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If no reviews in database, use default reviews
      if (reviewsData.length === 0) {
        setReviews(defaultReviews);
      } else {
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error loading reviews from Firebase:', error);
      setError('Failed to load reviews from Firebase');
      // If there's an error loading from Firebase, use default reviews
      setReviews(defaultReviews);
    } finally {
      setLoading(false);
    }
  };

  const loadMyReviews = async () => {
    if (!isAuthenticated()) return;

    try {
      const result = await reviewsAPI.getMyReviews();
      // Could use this for filtering if needed, but for now we show all reviews
    } catch (error) {
      console.error('Error loading my reviews:', error);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      setError('');
      // Only delete from Firebase if it's not a default review
      if (!reviewId.startsWith('default-')) {
        await deleteDoc(doc(db, 'reviews', reviewId));
      }
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      setSuccessMessage('Review deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting review from Firebase:', error);
      setError('Failed to delete review from Firebase. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const updateReview = async (reviewId, updatedData) => {
    try {
      // Only update in Firebase if it's not a default review
      if (!reviewId.startsWith('default-')) {
        const reviewRef = doc(db, 'reviews', reviewId);
        await updateDoc(reviewRef, {
          ...updatedData,
          updatedAt: new Date()
        });
      }

      setReviews(prev => prev.map(review =>
        review.id === reviewId ? { ...review, ...updatedData, updatedAt: new Date() } : review
      ));
      setSuccessMessage('Review updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating review in Firebase:', error);
      setError('Failed to update review in Firebase. Please try again.');
    }
  };

  const refreshReviews = () => {
    setLoading(true);
    loadAllReviews();
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
      comment: newReview.comment.trim(),
      userId: auth.currentUser ? auth.currentUser.uid : null,
      userName: auth.currentUser ? auth.currentUser.displayName || auth.currentUser.email.split('@')[0] : 'Anonymous',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Save to Firebase
      const docRef = await addDoc(collection(db, 'reviews'), reviewData);
      const newReviewWithId = { id: docRef.id, ...reviewData };

      setReviews(prev => [newReviewWithId, ...prev]);
      setNewReview({ movieTitle: '', rating: 0, comment: '' });
      setShowReviewForm(false);
      setError('');
      setSuccessMessage('Review created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating review in Firebase:', error);
      setError('Failed to save review to Firebase');
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
          {error && error.includes('index') ? 'Setting up database...' : 'Loading your reviews...'}
        </div>
        {error && error.includes('index') && (
          <div className="info-message">
            <p>⏳ Database is being optimized. This may take a moment...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="movies-container">
      <div className="movies-header">
        <h1>📝 All Reviews</h1>
        <p>View all movie reviews and add your own</p>

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
          {error.includes('index') ? '⏳' : '❌'} {error}
          {error.includes('index') && (
            <button onClick={refreshReviews} style={{marginLeft: '10px'}}>
              Try Again
            </button>
          )}
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
                  <StarRating rating={review.rating} />
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
                    Reviewed on {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
                  </span>
                  {review.updatedAt && review.updatedAt !== review.createdAt && (
                    <span className="updated-date">
                      Updated on {new Date(review.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="review-actions">
                  {isAuthenticated() && currentUser && 
                   (review.userId === currentUser.id || review.userId.startsWith('default-')) && (
                    <>
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
                    </>
                  )}
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