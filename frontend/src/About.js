import React from 'react';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>About MovieReview Hub</h1>
        <p>Your ultimate destination for movie reviews and ratings</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>🎯 Our Mission</h2>
          <p>
            MovieReview Hub was created to bring movie enthusiasts together in a 
            community where they can share their honest opinions, discover new films, 
            and connect with fellow cinema lovers.
          </p>
        </section>

        <section className="about-section">
          <h2>⭐ What We Offer</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎬</div>
              <h3>Movie Reviews</h3>
              <p>Read and write detailed reviews for any movie</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Rating System</h3>
              <p>Rate movies on a 5-star scale</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Community</h3>
              <p>Connect with other movie fans</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Personal Collection</h3>
              <p>Keep track of all your reviews</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>🚀 How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create an Account</h3>
                <p>Sign up to start reviewing movies</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Browse Reviews</h3>
                <p>See what others are watching and reviewing</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Share Your Thoughts</h3>
                <p>Write reviews and rate movies you've watched</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Manage Your Reviews</h3>
                <p>Edit or delete your reviews anytime</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>👨‍💻 About the Developer</h2>
          <p>
            This application was built with modern web technologies including React, 
            Node.js, Express, and Firebase. The focus is on creating a seamless user 
            experience for movie enthusiasts to share their passion for cinema.
          </p>
          <div className="tech-stack">
            <span className="tech-badge">React</span>
            <span className="tech-badge">Node.js</span>
            <span className="tech-badge">Express</span>
            <span className="tech-badge">Firebase</span>
            <span className="tech-badge">CSS3</span>
          </div>
        </section>

        <section className="about-section contact-section">
          <h2>📞 Get In Touch</h2>
          <p>
            Have questions, suggestions, or found a bug? We'd love to hear from you!
          </p>
          <div className="contact-info">
            <p>Email: support@moviereviewhub.com</p>
            <p>Follow us on social media for updates</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;