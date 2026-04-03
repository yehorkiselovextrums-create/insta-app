const { useState, useEffect } = React;

const API_URL = '/api';

function Navigation({ currentPage, onNavigate }) {
  return React.createElement('nav', null,
    React.createElement('div', { className: 'container' },
      React.createElement('h1', {
        onClick: () => onNavigate('feed'),
        style: { cursor: 'pointer' }
      }, '📷 InstaApp'),
      React.createElement('button', {
        onClick: () => onNavigate('create'),
        className: 'btn btn-primary'
      }, '+ Post')
    )
  );
}

function FeedPage({ onNavigate, onPostCreated }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [onPostCreated]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts`);
      const data = await response.json();
      console.log('Posts response:', { response, data, isArray: Array.isArray(data) });
      
      if (Array.isArray(data)) {
        setPosts(data);
        setError('');
      } else {
        console.error('Posts response is not an array:', data);
        setPosts([]);
        setError(data.error || 'Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setPosts([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/likes`, {
        method: 'PATCH'
      });
      const updatedPost = await response.json();
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'loading' },
      React.createElement('p', null, 'Loading posts...')
    );
  }

  if (error) {
    return React.createElement('main', null,
      React.createElement('div', { className: 'empty-state', style: { color: '#dc2626' } },
        React.createElement('p', null, 'Error: ' + error),
        React.createElement('p', { style: { fontSize: '0.9rem', marginTop: '1rem' } }, 
          'Please check the browser console for details.'
        )
      )
    );
  }

  if (posts.length === 0) {
    return React.createElement('main', null,
      React.createElement('div', { className: 'empty-state' },
        React.createElement('p', null, 'No posts yet. Create one!')
      )
    );
  }

  return React.createElement('main', null,
    React.createElement('div', { className: 'feed-grid' },
      posts.map(post =>
        React.createElement('div', {
          key: post.id,
          className: 'post-card',
          onClick: () => onNavigate('post', post.id)
        },
          React.createElement('img', {
            src: post.image_url,
            alt: post.title,
            className: 'post-image',
            onError: (e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23e0e0e0" width="300" height="300"/%3E%3Ctext x="50%" y="50%" font-size="18" text-anchor="middle" dominant-baseline="middle" fill="%23999"%3EImage not found%3C/text%3E%3C/svg%3E';
            }
          }),
          React.createElement('div', { className: 'post-info' },
            React.createElement('div', { className: 'post-title' }, post.title),
            post.caption && React.createElement('div', { className: 'post-caption' }, post.caption),
            React.createElement('div', { className: 'post-meta' },
              React.createElement('span', null, new Date(post.created_at).toLocaleDateString()),
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' } },
                React.createElement('button', {
                  className: 'like-btn',
                  onClick: (e) => {
                    e.stopPropagation();
                    handleLike(post.id);
                  }
                }, '❤️'),
                React.createElement('span', null, post.likes)
              )
            )
          )
        )
      )
    )
  );
}

function PostPage({ postId, onNavigate }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`);
      if (!response.ok) throw new Error('Post not found');
      const data = await response.json();
      setPost(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch post:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/likes`, {
        method: 'PATCH'
      });
      const updatedPost = await response.json();
      setPost(updatedPost);
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  if (loading) {
    return React.createElement('main', null,
      React.createElement('div', { className: 'loading' },
        React.createElement('p', null, 'Loading post...')
      )
    );
  }

  if (error || !post) {
    return React.createElement('main', null,
      React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement('p', { style: { color: '#dc2626' } }, 'Error: ' + (error || 'Post not found')),
        React.createElement('button', {
          onClick: () => onNavigate('feed'),
          className: 'back-link'
        }, '← Back to feed')
      )
    );
  }

  return React.createElement('main', null,
    React.createElement('button', {
      onClick: () => onNavigate('feed'),
      className: 'back-link',
      style: { display: 'block' }
    }, '← Back to feed'),
    React.createElement('div', { className: 'post-detail' },
      React.createElement('img', {
        src: post.image_url,
        alt: post.title,
        onError: (e) => {
          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="400"%3E%3Crect fill="%23e0e0e0" width="500" height="400"/%3E%3Ctext x="50%" y="50%" font-size="18" text-anchor="middle" dominant-baseline="middle" fill="%23999"%3EImage not found%3C/text%3E%3C/svg%3E';
        }
      }),
      React.createElement('div', { className: 'post-detail-content' },
        React.createElement('h1', null, post.title),
        post.caption && React.createElement('p', { className: 'post-detail-caption' }, post.caption),
        React.createElement('div', { className: 'post-detail-footer' },
          React.createElement('span', { className: 'post-date' },
            new Date(post.created_at).toLocaleString()
          ),
          React.createElement('div', { className: 'like-section' },
            React.createElement('button', {
              onClick: handleLike
            }, '❤️'),
            React.createElement('span', null, post.likes, ' likes')
          )
        )
      )
    )
  );
}

function CreatePostPage({ onNavigate, onPostCreated }) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !imageUrl.trim()) {
      setError('Title and image URL are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          image_url: imageUrl.trim(),
          caption: caption.trim()
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create post');
      }

      const newPost = await response.json();
      onPostCreated(newPost);
      onNavigate('feed');
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('main', null,
    React.createElement('div', { className: 'form-container' },
      React.createElement('h2', null, 'Create a New Post'),

      error && React.createElement('div', { className: 'error-message' }, error),

      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Title *'),
          React.createElement('input', {
            type: 'text',
            value: title,
            onChange: (e) => setTitle(e.target.value),
            placeholder: "What's your post about?",
            disabled: loading
          })
        ),

        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Image URL *'),
          React.createElement('input', {
            type: 'url',
            value: imageUrl,
            onChange: (e) => setImageUrl(e.target.value),
            placeholder: 'https://example.com/image.jpg',
            disabled: loading
          }),
          imageUrl && React.createElement('div', { className: 'form-preview' },
            React.createElement('img', {
              src: imageUrl,
              alt: 'Preview',
              onError: () => console.log('Image preview failed')
            })
          )
        ),

        React.createElement('div', { className: 'form-group' },
          React.createElement('label', null, 'Caption'),
          React.createElement('textarea', {
            value: caption,
            onChange: (e) => setCaption(e.target.value),
            placeholder: 'Add a caption to your post...',
            disabled: loading
          })
        ),

        React.createElement('div', { className: 'form-buttons' },
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'btn btn-primary'
          }, loading ? 'Creating...' : 'Create Post'),
          React.createElement('button', {
            type: 'button',
            onClick: () => onNavigate('feed'),
            disabled: loading,
            className: 'btn btn-secondary'
          }, 'Cancel')
        )
      )
    )
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('feed');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [postCreatedTrigger, setPostCreatedTrigger] = useState(0);

  const navigate = (page, postId = null) => {
    setCurrentPage(page);
    if (postId) setSelectedPostId(postId);
    window.scrollTo(0, 0);
  };

  const handlePostCreated = (post) => {
    setPostCreatedTrigger(prev => prev + 1);
  };

  return React.createElement(React.Fragment, null,
    React.createElement(Navigation, { currentPage, onNavigate: navigate }),
    currentPage === 'feed' && React.createElement(FeedPage, { onNavigate: navigate, onPostCreated: postCreatedTrigger }),
    currentPage === 'post' && React.createElement(PostPage, { postId: selectedPostId, onNavigate: navigate }),
    currentPage === 'create' && React.createElement(CreatePostPage, { onNavigate: navigate, onPostCreated: handlePostCreated })
  );
}

ReactDOM.render(React.createElement(App), document.getElementById('root'));