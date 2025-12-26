import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { token } = useContext(AuthContext);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Multi-Tenant SaaS Platform</h1>
          <p className="hero-subtitle">Powerful Project & Task Management for Organizations</p>
          <div className="hero-buttons">
            {token ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-large">Go to Dashboard</Link>
                <Link to="/projects" className="btn btn-secondary btn-large">View Projects</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">Get Started Free</Link>
                <Link to="/login" className="btn btn-secondary btn-large">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Multi-Tenant Architecture</h3>
            <p>Complete data isolation with dedicated tenant support</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Project Management</h3>
            <p>Create and manage projects with full team collaboration</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Task Tracking</h3>
            <p>Track tasks with status updates and deadlines</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>User Management</h3>
            <p>Role-based access control for team members</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Track project progress with detailed reports</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Security</h3>
            <p>Enterprise-grade security with JWT authentication</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Sign Up</h3>
            <p>Register your organization with a unique subdomain</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Create Projects</h3>
            <p>Set up projects and invite team members</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Manage Tasks</h3>
            <p>Create, assign, and track tasks collaboratively</p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <h3>Collaborate</h3>
            <p>Work together in real-time with your team</p>
          </div>
        </div>
      </section>

      <section className="pricing">
        <h2>Simple Pricing</h2>
        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>Starter</h3>
            <p className="price">Free</p>
            <ul className="features-list">
              <li>✓ Up to 5 projects</li>
              <li>✓ Up to 10 team members</li>
              <li>✓ Basic task management</li>
              <li>✗ Advanced analytics</li>
            </ul>
            <button className="btn btn-secondary">Get Started</button>
          </div>
          <div className="pricing-card featured">
            <div className="badge">Popular</div>
            <h3>Professional</h3>
            <p className="price">$29<span>/month</span></p>
            <ul className="features-list">
              <li>✓ Unlimited projects</li>
              <li>✓ Unlimited team members</li>
              <li>✓ Advanced task management</li>
              <li>✓ Analytics & reports</li>
            </ul>
            <button className="btn btn-primary">Choose Plan</button>
          </div>
          <div className="pricing-card">
            <h3>Enterprise</h3>
            <p className="price">Custom</p>
            <ul className="features-list">
              <li>✓ Everything in Professional</li>
              <li>✓ Dedicated support</li>
              <li>✓ Custom integrations</li>
              <li>✓ SLA guarantees</li>
            </ul>
            <button className="btn btn-secondary">Contact Sales</button>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <p>&copy; 2025 Multi-Tenant SaaS Platform. All rights reserved.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#contact">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;