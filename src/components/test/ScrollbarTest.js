import React from 'react';
import './ScrollbarTest.css';

const ScrollbarTest = () => {
  return (
    <div className="scrollbar-test">
      <h2>Scrollbar Test Page</h2>
      <p>This page tests that scrollbars are hidden while maintaining scroll functionality.</p>
      
      <div className="scrollbar-test__section">
        <h3>Vertical Scroll Test</h3>
        <div className="scrollbar-test__vertical-container">
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} className="scrollbar-test__item">
              Item {i + 1} - This is a test item to create vertical scrolling content
            </div>
          ))}
        </div>
      </div>

      <div className="scrollbar-test__section">
        <h3>Modal Test</h3>
        <div className="scrollbar-test__modal">
          <div className="scrollbar-test__modal-content">
            <h4>Modal with Scrollable Content</h4>
            {Array.from({ length: 30 }, (_, i) => (
              <p key={i}>
                This is paragraph {i + 1} in the modal. It should be scrollable without showing scrollbars.
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="scrollbar-test__section">
        <h3>Textarea Test</h3>
        <textarea 
          className="scrollbar-test__textarea"
          placeholder="Type here... This textarea should be scrollable without showing scrollbars"
          rows={5}
        />
      </div>
    </div>
  );
};

export default ScrollbarTest;