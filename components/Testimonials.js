'use client';
import { useState, useEffect } from 'react';

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={readonly ? 'button' : 'button'}
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: readonly ? 'default' : 'pointer',
            padding: '2px',
            fontSize: readonly ? '18px' : '24px',
            color: star <= (hovered || value) ? '#facc15' : '#334155',
            transition: 'color 0.15s',
          }}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }) {
  const date = new Date(testimonial.created_at).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const initials = testimonial.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        backgroundColor: '#16182a',
        border: '1px solid #1e2d4a',
        borderRadius: '16px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Quote mark */}
      <div style={{ color: '#2563eb', fontSize: '36px', lineHeight: 1, opacity: 0.6 }}>"</div>

      <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.7', flex: 1 }}>
        {testimonial.message}
      </p>

      <StarRating value={testimonial.rating} readonly />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid #1e2d4a' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '14px', color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ color: '#f0f4ff', fontWeight: 600, fontSize: '14px' }}>{testimonial.name}</div>
          <div style={{ color: '#475569', fontSize: '12px' }}>{date}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialForm({ onSubmitted }) {
  const [form, setForm] = useState({ name: '', rating: 0, message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.rating) { setError('Please select a star rating.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      setSuccess(true);
      setForm({ name: '', rating: 0, message: '' });
      if (onSubmitted) onSubmitted(data.testimonial);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        backgroundColor: '#16182a', border: '1px solid rgba(37,99,235,0.4)',
        borderRadius: '16px', padding: '40px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <h3 style={{ color: '#f0f4ff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          Thank You!
        </h3>
        <p style={{ color: '#64748b' }}>Your testimonial has been submitted successfully.</p>
        <button
          onClick={() => setSuccess(false)}
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer',
          }}
        >
          Add Another
        </button>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    backgroundColor: '#0d0f1e',
    border: '1px solid #1e2d4a',
    color: '#f0f4ff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#16182a',
        border: '1px solid #1e2d4a',
        borderRadius: '16px',
        padding: '32px',
      }}
    >
      <h3 style={{ color: '#f0f4ff', fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>
        Share Your Experience
      </h3>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', padding: '12px 16px', color: '#f87171',
          fontSize: '14px', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your Name *
        </label>
        <input
          type="text"
          placeholder="e.g. John Kamau"
          value={form.name}
          required
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = '#2563eb'}
          onBlur={(e) => e.target.style.borderColor = '#1e2d4a'}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your Rating *
        </label>
        <StarRating value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your Testimonial *
        </label>
        <textarea
          placeholder="Tell others about your experience with MZAZI TECH..."
          value={form.message}
          required
          rows={5}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
          onFocus={(e) => e.target.style.borderColor = '#2563eb'}
          onBlur={(e) => e.target.style.borderColor = '#1e2d4a'}
        />
        <div style={{ color: '#475569', fontSize: '12px', marginTop: '6px', textAlign: 'right' }}>
          {form.message.length} / 1000
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          background: loading ? '#1e2d4a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: loading ? '#64748b' : '#fff',
          fontWeight: 700,
          fontSize: '16px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 0 24px rgba(37,99,235,0.35)',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'Submitting...' : 'Submit Testimonial'}
      </button>
    </form>
  );
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((data) => setTestimonials(data.testimonials || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleNewTestimonial = (t) => {
    setTestimonials((prev) => [t, ...prev]);
  };

  const avgRating = testimonials.length
    ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1)
    : null;

  return (
    <section style={{ backgroundColor: '#0d0d1a', padding: '80px 0' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 16px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '99px', marginBottom: '20px',
            backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
          }}>
            <span style={{ color: '#facc15', fontSize: '16px' }}>★</span>
            <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: 600 }}>
              {avgRating ? `${avgRating} avg rating · ` : ''}{testimonials.length} {testimonials.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          <h2 style={{ color: '#f0f4ff', fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>
            What Our Clients Say
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
            Real experiences from real customers across Kenya and beyond.
          </p>
        </div>

        {/* Testimonial cards */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#475569', padding: '40px 0' }}>Loading testimonials…</div>
        ) : testimonials.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px',
            backgroundColor: '#16182a', border: '1px solid #1e2d4a',
            borderRadius: '16px', marginBottom: '48px', color: '#64748b',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
            <p>No testimonials yet — be the first to share your experience!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '64px',
          }}>
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        )}

        {/* Submit form */}
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <TestimonialForm onSubmitted={handleNewTestimonial} />
        </div>
      </div>
    </section>
  );
}
