// Uses POLITICO fork of pym.js: https://github.com/The-Politico/pym.js
// Checks for existence of pym before setting global.
import pym from 'pym.js';

const werks = document.querySelectorAll('.chartwerk');

for (let i = 0; i < werks.length; i++) {
  const werk = werks[i];
  const id = werk.dataset.id;
  const chartPath = werk.dataset.src;
  const paths = {
    single: `${chartPath}${id}_single.html`,
    double: `${chartPath}${id}.html`,
  };
  const dimensions = JSON.parse(werk.dataset.dimensions);
  const size = werk.dataset.size;
  const viewportWidth = werk.parentElement.clientWidth;
  let pymParent;
  // Check if iframe already embedded. (Handles for multiple embedded charts...)
  if (werk.querySelectorAll('iframe').length < 1) {
    // double-wide
    if (size === 'double') {
      if (viewportWidth > dimensions.double.width) {
        werk.style.width = '100%';
        pymParent = new pym.Parent(werk.id, paths.double, {});
      } else {
        werk.style.width = `${dimensions.single.width}px`;
        pymParent = new pym.Parent(werk.id, paths.single, {});
        // Add a class which can be used to float div
        if (viewportWidth > (dimensions.single.width * 1.75)) {
          werk.classList.add('floated');
        }
      }
    // single-wide
    } else {
      werk.style.width = `${dimensions.single.width}px`;
      pymParent = new pym.Parent(werk.id, paths.single, {});
      // Add a class which can be used to float div
      if (viewportWidth > (dimensions.single.width * 1.75)) {
        werk.classList.add('floated');
      }
    }
  }
}
