// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

export default async function decorate(block) {
  // Check if card-style-tab variant is requested
  const cardStyleVariant = block.classList.contains('card-style-tab');
  
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');
  tablist.id = `tablist-${tabBlockCnt += 1}`;

  // the first cell of each row is the title of the tab
  const tabHeadings = [...block.children]
    .filter((child) => child.firstElementChild && child.firstElementChild.children.length > 0)
    .map((child) => child.firstElementChild);

  tabHeadings.forEach((tab, i) => {
    const id = `tabpanel-${tabBlockCnt}-tab-${i + 1}`;

    // decorate tabpanel
    const tabpanel = block.children[i];
    
    // For card-style-tab variant, reorganize content first
    if (cardStyleVariant) {
      // Find image and text content
      const picture = tabpanel.querySelector('picture');
      const allChildren = [...tabpanel.children];
      
      if (picture) {
        // Create wrapper for image
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'tabs-panel-image';
        picture.parentNode.replaceChild(imageWrapper, picture);
        imageWrapper.appendChild(picture);
        
        // Create wrapper for content
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'tabs-panel-content';
        
        // Move remaining children to content wrapper
        allChildren.forEach((child) => {
          if (child !== imageWrapper) {
            contentWrapper.appendChild(child);
          }
        });
        
        // Clear tabpanel and add wrappers
        tabpanel.innerHTML = '';
        tabpanel.appendChild(imageWrapper);
        tabpanel.appendChild(contentWrapper);
      }
    }
    
    tabpanel.className = 'tabs-panel';
    tabpanel.id = id;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;

    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', id);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');

    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });

    // add the new tab list button, to the tablist
    tablist.append(button);

    // remove the tab heading from the dom, which also removes it from the UE tree
    tab.remove();

    // remove the instrumentation from the button's h1, h2 etc (this removes it from the tree)
    if (button.firstElementChild) {
      moveInstrumentation(button.firstElementChild, null);
    }
  });

  block.prepend(tablist);
}