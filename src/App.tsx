// App.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './index.css';
import imageBoardClient from './client-script';

interface Post {
  id: number;
  timestamp: string;
  postNumber: number;
  image?: {
    url: string;
    filename: string;
    fileSize: string;
    width?: number;
    height?: number;
  };
  video?: {
    url: string;
    filename: string;
    fileSize: string;
    width?: number;
    height?: number;
  };
  text: string;
  isOP?: boolean;
  threadName?: string;
}

// Client API Interface
interface ClientAPI {
  onNewPost: (callback: (post: Post, allPosts: Post[]) => void) => void;
  getAllPosts: () => Post[];
  getPostElement: (postId: number) => HTMLElement | null;
  modifyPost: (postId: number, modifications: any) => void;
}

// Moved outside the component as it's a pure utility function
const formatTimestamp = (): string => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const day = days[now.getDay()];
  const date = now.getDate().toString().padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${date} ${month} ${year} (${day}) ${hours}:${minutes}:${seconds}`;
};

// Helper component for rendering file info
const RenderFileInfo: React.FC<{
  file: { filename: string; fileSize: string; width?: number; height?: number };
}> = React.memo(({ file }) => (
  <div className="file-info">
    <span className="file-size">
      ({file.fileSize}
      {file.width && file.height && `, ${file.width}x${file.height}`})
    </span>
    <span className="file-name">{file.filename}</span>
  </div>
));

const ImageBoard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      timestamp: '24 Jun 2024 (Mon) 20:50:27',
      postNumber: 1697448,
      image: {
        url: 'https://picsum.photos/150/200?random=1',
        filename: '8fc68f802ae1c34122ed99544bf813e7b3d9cb79c.png',
        fileSize: '311 KB',
        width: 509,
        height: 509
      },
      text: 'A thread where only this image is posted, any text is fine >>1697451\n>This is a greentext line\n>Another greentext',
      isOP: true,
      threadName: 'My Awesome Thread'
    },
    {
      id: 2,
      timestamp: '24 Jun 2024 (Mon) 20:50:42',
      postNumber: 1697451,
      text: 'first reply\n>greentext test on reply'
    },
    {
      id: 3,
      timestamp: '24 Jun 2024 (Mon) 20:50:48',
      postNumber: 1697452,
      image: {
        url: 'https://picsum.photos/150/200?random=2',
        filename: 'OO.png',
        fileSize: '311 KB',
        width: 509,
        height: 509
      },
      text: 'test\nto\nsee\nif\ntext\nis\naligned\nwith\nimage\non\npost\nwow\ncoolio'
    },
    {
      id: 4,
      timestamp: '24 Jun 2024 (Mon) 20:51:01',
      postNumber: 1697453,
      image: {
        url: 'https://picsum.photos/150/200?random=3',
        filename: '3333.png',
        fileSize: '311 KB',
        width: 509,
        height: 509
      },
      text: 'am i in the right thread? >>1697452 >>1697452 lets test the overflow text itsssssssssssssssss works until it reaches half the screen, here it comes!!!! yippie!!\n>even with greentext'
    },
    {
      id: 5,
      timestamp: '24 Jun 2024 (Mon) 20:51:26',
      postNumber: 1697458,
      image: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/International_Pok%C3%A9mon_logo.svg/1200px-International_Pok%C3%A9mon_logo.svg.png',
        filename: 'OO.png',
        fileSize: '311 KB',
        width: 1200,
        height: 440
      },
      text: 'hi >>1697453'
    },
    {
      id: 6,
      timestamp: '24 Jun 2024 (Mon) 20:52:00',
      postNumber: 1697459,
      video: {
        url: 'https://i.4cdn.org/g/1749058646490109.mp4',
        filename: 'example_video.mp4',
        fileSize: '5.2 MB',
        width: 640,
        height: 360,
      },
      text: 'Check out this cool video!'
    }
  ]);

  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [nextPostNumber, setNextPostNumber] = useState(1697460);
  const [isDragging, setIsDragging] = useState(false);
  const [dialogPosition, setDialogPosition] = useState({ x: 50, y: 50 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const [postReplies, setPostReplies] = useState<Record<number, Set<number>>>({});
  const [expandedImageId, setExpandedImageId] = useState<number | null>(null);
  const [expandedImageWidth, setExpandedImageWidth] = useState<number | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [hoveredImageId, setHoveredImageId] = useState<number | null>(null);
  
  // Client API callbacks
  const newPostCallbacks = useRef<Array<(post: Post, allPosts: Post[]) => void>>([]);

  const videoThumbnailHoverRef = useRef(false);
  const videoPlayerHoverRef = useRef(false);
  const hideVideoTimeoutRef = useRef<number | null>(null);

  
  // Initialize Client API
  useEffect(() => {
    const clientAPI: ClientAPI = {
      onNewPost: (callback: (post: Post, allPosts: Post[]) => void) => {
        newPostCallbacks.current.push(callback);
      },
      getAllPosts: () => posts,
      getPostElement: (postId: number) => {
        return document.querySelector(`[data-post-id="${postId}"]`);
      },
      modifyPost: (postId: number, modifications: any) => {
        const element = document.querySelector(`[data-post-id="${postId}"]`);
        if (element) {
          if (modifications.textColor) {
            const textElement = element.querySelector('.post-text');
            if (textElement) {
              (textElement as HTMLElement).style.color = modifications.textColor;
            }
          }
          if (modifications.fontSize) {
            const textElement = element.querySelector('.post-text');
            if (textElement) {
              (textElement as HTMLElement).style.fontSize = modifications.fontSize;
            }
          }
          if (modifications.text) {
            const textElement = element.querySelector('.post-text');
            if (textElement) {
              (textElement as HTMLElement).textContent = modifications.text;
            }
          }
          if (modifications.backgroundColor) {
            (element as HTMLElement).style.backgroundColor = modifications.backgroundColor;
          }
          if (modifications.borderColor) {
            (element as HTMLElement).style.borderColor = modifications.borderColor;
          }
          
          // Add more modification types as needed
        }
      }
    };

    // Expose API to global scope for client scripts
    (window as any).ImageBoardAPI = clientAPI;

    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('imageboardReady', { detail: clientAPI }));
  }, [posts]);

  useEffect(() => {
    const newPostReplies: Record<number, Set<number>> = {};
    posts.forEach(post => {
      const mentions = post.text.match(/>>(\d+)/g);
      if (mentions) {
        mentions.forEach(mention => {
          const mentionedPostNumber = parseInt(mention.substring(2));
          if (posts.some(p => p.postNumber === mentionedPostNumber)) {
            if (!newPostReplies[mentionedPostNumber]) {
              newPostReplies[mentionedPostNumber] = new Set();
            }
            newPostReplies[mentionedPostNumber].add(post.postNumber);
          }
        });
      }
    });
    setPostReplies(newPostReplies);
  }, [posts]);

  const handleReply = useCallback(() => {
    setShowReplyDialog(true);
  }, []);

  const handleSubmitReply = useCallback(() => {
    if (replyText.trim()) {
      const newPost: Post = {
        id: Date.now(),
        timestamp: formatTimestamp(),
        postNumber: nextPostNumber,
        text: replyText.trim(),
      };

      setPosts(prevPosts => {
        const updatedPosts = [...prevPosts, newPost];
        
        // Trigger client callbacks after state update
        setTimeout(() => {
          newPostCallbacks.current.forEach(callback => {
            try {
              callback(newPost, updatedPosts);
            } catch (error) {
              console.error('Client callback error:', error);
            }
          });
        }, 0);
        
        return updatedPosts;
      });
      
      setNextPostNumber(prev => prev + 1);
      setReplyText('');
      setShowReplyDialog(false);
    }
  }, [replyText, nextPostNumber]);

  const handleCancelReply = useCallback(() => {
    setReplyText('');
    setShowReplyDialog(false);
  }, []);

  const handlePostIdClick = useCallback((postNumber: number) => {
    setShowReplyDialog(true);
    setReplyText(prevText => {
      const newMention = `>>${postNumber}`;
      return prevText ? `${prevText}\n${newMention}` : newMention;
    });
  }, []);

  const renderPostText = useCallback((text: string) => {
    return text.split('\n').map((line, lineIndex) => {
      const parts = line.split(/(>>\d+)/g);
      return (
        <React.Fragment key={lineIndex}>
          {line.startsWith('>') && !line.match(/^>>\d+/) ? (
            <span className="greentext">{line}</span>
          ) : (
            parts.map((part, partIndex) => {
              if (part.match(/^>>\d+$/)) {
                const postId = parseInt(part.substring(2));
                return (
                  <span
                    key={partIndex}
                    className="post-reply-mention"
                    onClick={() => handlePostIdClick(postId)}
                  >
                    {part}
                  </span>
                );
              }
              return part;
            })
          )}
          {lineIndex < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  }, [handlePostIdClick]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - dialogPosition.x,
      y: e.clientY - dialogPosition.y,
    };
  }, [dialogPosition.x, dialogPosition.y]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setDialogPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }
  }, [isDragging]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImageClick = useCallback((postId: number, imageUrl: string) => {
    if (expandedImageId === postId) {
      setExpandedImageId(null);
      setExpandedImageWidth(null);
    } else {
      setHoveredImageId(null);
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        setExpandedImageId(postId);
        if (img.naturalWidth > window.innerWidth * 0.4) {
          setExpandedImageWidth(img.naturalWidth);
        } else {
          setExpandedImageWidth(null);
        }
      };
    }
  }, [expandedImageId]);

  const handleVideoThumbnailMouseEnter = useCallback((videoUrl: string) => {
    if (hideVideoTimeoutRef.current) {
      clearTimeout(hideVideoTimeoutRef.current);
      hideVideoTimeoutRef.current = null;
    }
    videoThumbnailHoverRef.current = true;
    setHoveredVideo(videoUrl);
  }, []);

  const handleVideoThumbnailMouseLeave = useCallback(() => {
    videoThumbnailHoverRef.current = false;
    if (!videoPlayerHoverRef.current) {
      hideVideoTimeoutRef.current = window.setTimeout(() => {
        if (!videoThumbnailHoverRef.current && !videoPlayerHoverRef.current) {
          setHoveredVideo(null);
        }
      }, 100);
    }
  }, []);

  const handleVideoPlayerMouseEnter = useCallback(() => {
    if (hideVideoTimeoutRef.current) {
      clearTimeout(hideVideoTimeoutRef.current);
      hideVideoTimeoutRef.current = null;
    }
    videoPlayerHoverRef.current = true;
  }, []);

  const handleVideoPlayerMouseLeave = useCallback(() => {
    videoPlayerHoverRef.current = false;
    if (!videoThumbnailHoverRef.current) {
      hideVideoTimeoutRef.current = window.setTimeout(() => {
        if (!videoThumbnailHoverRef.current && !videoPlayerHoverRef.current) {
          setHoveredVideo(null);
        }
      }, 100);
    }
  }, []);

  const handleImageThumbnailMouseEnter = useCallback((postId: number) => {
    if (expandedImageId !== postId) {
      setHoveredImageId(postId);
    }
  }, [expandedImageId]);

  const handleImageThumbnailMouseLeave = useCallback(() => {
    setHoveredImageId(null);
  }, []);


  return (
    <div className="imageboard">
      <div className="board-header">
        <span className="board-title">/tv/ [+]</span>
        <div className="board-nav">
          [Bottom][Return][Catalog][Expand Images][Show Rules]
        </div>
      </div>

      <div className="thread">
        {posts.map((post) => (
          <div 
            key={post.id} 
            className={`post ${post.isOP ? 'op-post' : 'reply-post'} ${expandedImageId === post.id && expandedImageWidth !== null ? 'full-width-post' : ''}`}
            data-post-id={post.id}
          >
            <div className="post-header">
              <span className="post-info">
                {post.isOP && post.threadName && (
                  <span className="board-name-info">/tv/</span>
                )}
                {post.isOP && post.threadName && (
                  <span className="thread-name">{post.threadName}</span>
                )}
                <span className="anonymous-name">Anonymous</span> {post.timestamp} <span className="post-id" onClick={() => handlePostIdClick(post.postNumber)}>No.{post.postNumber}</span>
              </span>
            </div>

            <div className="post-content">
              {post.image ? (
                <>
                  <RenderFileInfo file={post.image} />
                  <div className="post-content-with-image">
                    <div
                      className="post-image"
                      onMouseEnter={() => handleImageThumbnailMouseEnter(post.id)}
                      onMouseLeave={handleImageThumbnailMouseLeave}
                    >
                      <img
                        src={post.image.url}
                        alt="Post attachment"
                        className={`thumbnail ${expandedImageId === post.id ? 'expanded' : ''}`}
                        onClick={() => handleImageClick(post.id, post.image!.url)}
                      />
                    </div>
                    {post.text && (
                      <div className="post-text">
                        {renderPostText(post.text)}
                      </div>
                    )}
                  </div>
                </>
              ) : post.video ? (
                <>
                  <RenderFileInfo file={post.video} />
                  <div className="post-content-with-image">
                    <div
                      className="post-video-thumbnail"
                      onMouseEnter={() => handleVideoThumbnailMouseEnter(post.video!.url)}
                      onMouseLeave={handleVideoThumbnailMouseLeave}
                    >
                      <video
                        className="thumbnail"
                        src={post.video.url}
                        poster={post.video.url}
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    {post.text && (
                      <div className="post-text">
                        {renderPostText(post.text)}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                post.text && (
                  <div className="post-text post-text-only">
                    {renderPostText(post.text)}
                  </div>
                )
              )}
            </div>
            {postReplies[post.postNumber] && postReplies[post.postNumber].size > 0 && (
              <div className="replies-to-this-post">
                {Array.from(postReplies[post.postNumber]).sort((a, b) => a - b).map((replyPostNumber, index) => (
                  <span key={index} className="reply-to-mention">
                    &gt;&gt;{replyPostNumber}{' '}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="reply-section">
        <button className="reply-button" onClick={handleReply}>
          Reply
        </button>
      </div>

      {showReplyDialog && (
        <div
          className="reply-dialog"
          style={{ top: dialogPosition.y, left: dialogPosition.x }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          <div className="reply-dialog-header" onMouseDown={onMouseDown}>
            <h3>Reply</h3>
            <button className="close-button" onClick={handleCancelReply}>×</button>
          </div>
          <div className="reply-dialog-content">
            <textarea
              className="reply-textarea"
              placeholder="Enter your message here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              autoFocus
            />
          </div>
          <div className="reply-dialog-footer">
            <button className="cancel-button" onClick={handleCancelReply}>
              Cancel
            </button>
            <button
              className="submit-button"
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
            >
              Post Reply
            </button>
          </div>
        </div>
      )}

      {hoveredVideo && (
        <div
          className="floating-video-player-container"
          onMouseEnter={handleVideoPlayerMouseEnter}
          onMouseLeave={handleVideoPlayerMouseLeave}
        >
          <video
            key={hoveredVideo}
            className="video-player"
            controls
            autoPlay
            loop
          >
            <source src={hoveredVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {hoveredImageId !== null && expandedImageId !== hoveredImageId && (
        posts.find(post => post.id === hoveredImageId)?.image && (
          <div className="floating-image-viewer-container">
            <div className="floating-image-content">
              <img
                src={posts.find(post => post.id === hoveredImageId)?.image?.url}
                alt="Hovered attachment"
                className="floating-image-preview"
              />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ImageBoard;