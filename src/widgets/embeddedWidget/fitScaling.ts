/**
 * Fit scaling for embedded content.
 * 
 * Measures natural content size and scales it down to fit
 * within the container while maintaining aspect ratio.
 */

/**
 * Apply scaling to fit content within the container.
 * Measures the natural content size and scales it down if needed.
 * Centers the scaled content using translate.
 * 
 * @param wrapper - The content wrapper element
 * @param container - The container element to fit within
 */
export function applyFitScaling(wrapper: HTMLElement, container: HTMLElement): void {
  // Hide content during measurement to prevent visual flash
  wrapper.style.visibility = 'hidden';

  // Use requestAnimationFrame to ensure content is rendered before measuring
  requestAnimationFrame(() => {
    // Get the container dimensions (available space)
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width;
    const availableHeight = containerRect.height;

    // Temporarily reset styles to measure natural size
    wrapper.style.transform = '';
    wrapper.style.position = '';
    wrapper.style.top = '';
    wrapper.style.left = '';
    wrapper.style.width = 'max-content';
    wrapper.style.height = 'max-content';

    // Measure the natural content size
    const contentWidth = wrapper.scrollWidth;
    const contentHeight = wrapper.scrollHeight;

    // Calculate the scale factor needed to fit
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    if (scale < 1) {
      // Position at center and apply scale transform
      // translate(-50%, -50%) centers the element, then scale shrinks it
      wrapper.style.position = 'absolute';
      wrapper.style.top = '50%';
      wrapper.style.left = '50%';
      wrapper.style.transformOrigin = 'center center';
      wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
      wrapper.classList.add('pebbledash-fit-wrapper', 'pebbledash-fit-scaled');
    } else {
      // Content fits naturally, just center it without scaling
      wrapper.style.position = 'absolute';
      wrapper.style.top = '50%';
      wrapper.style.left = '50%';
      wrapper.style.transform = 'translate(-50%, -50%)';
      wrapper.classList.add('pebbledash-fit-wrapper');
    }

    // Show content after scaling is applied
    wrapper.style.visibility = 'visible';
  });
}

