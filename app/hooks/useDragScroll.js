import { useRef, useEffect } from 'react';

export default function useDragScroll() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let rafId = null;

    const handleMouseDown = (e) => {
      // Only drag with primary mouse button (left click)
      if (e.button !== 0) return;
      isDown = true;
      isDragging = false;

      // Cancel any ongoing momentum scroll animation
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      // Temporarily disable CSS snapping and smooth scroll
      el.classList.remove('scroll-smooth', 'snap-x');

      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      lastX = e.pageX;
      lastTime = Date.now();
      velocity = 0;
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();

      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5; // Drag speed multiplier

      if (Math.abs(x - startX) > 5) {
        isDragging = true;
      }

      // Calculate instant velocity based on mouse speed (px/ms)
      const now = Date.now();
      const timeElapsed = now - lastTime;
      if (timeElapsed > 0) {
        const deltaX = e.pageX - lastX;
        velocity = deltaX / timeElapsed;
        lastX = e.pageX;
        lastTime = now;
      }

      el.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      if (!isDown) return;
      isDown = false;

      // If the user was dragging and has some release velocity, apply momentum (inertia)
      if (isDragging && Math.abs(velocity) > 0.05) {
        // Translate to pixels per frame (assuming 60fps base, 1 frame ≈ 16ms)
        let speed = velocity * 16;
        
        // Clamp maximum momentum speed to prevent extreme scrolling
        speed = Math.max(-25, Math.min(25, speed));

        const momentumLoop = () => {
          el.scrollLeft -= speed;
          speed *= 0.92; // Friction coefficient (deceleration)

          if (Math.abs(speed) > 0.3) {
            rafId = requestAnimationFrame(momentumLoop);
          } else {
            // Restore snapping and smooth scrolling when sliding stops
            el.classList.add('scroll-smooth', 'snap-x');
            rafId = null;
          }
        };

        rafId = requestAnimationFrame(momentumLoop);
      } else {
        // Re-enable smooth scroll and snapping immediately if no momentum is needed
        el.classList.add('scroll-smooth', 'snap-x');
      }
    };

    const handleMouseLeave = () => {
      if (isDown) {
        handleMouseUp();
      }
    };

    const handleDragStart = (e) => {
      e.preventDefault();
    };

    const handleClick = (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('click', handleClick, true); // Capture phase to prevent link clicks

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('dragstart', handleDragStart);
      el.removeEventListener('click', handleClick, true);
    };
  }, []);

  return ref;
}
