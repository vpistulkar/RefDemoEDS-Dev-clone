// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

export default async function decorate(block) {
  // Get the tabs style from data-aue-prop
  const tabsStyleParagraph = block.querySelector('p[data-aue-prop="tabsstyle"]');
  // Find the direct child div that contains this paragraph
  let tabsStyleDiv = null;
  if (tabsStyleParagraph) {
    tabsStyleDiv = [...block.children].find(child => child.contains(tabsStyleParagraph));
  }
  const tabsStyle = tabsStyleParagraph?.textContent?.trim() || '';
  
  // Add the style class to block
  if (tabsStyle && tabsStyle !== 'default' && tabsStyle !== '') {
    block.classList.add(tabsStyle);
  }
  
  // Hide and exclude the style configuration div from being treated as a tab
  if (tabsStyleDiv) {
    tabsStyleDiv.style.display = 'none';
  }
  
  // Check if card-style-tab variant is requested
  const cardStyleVariant = block.classList.contains('card-style-tab');
  
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');
  tablist.id = `tablist-${tabBlockCnt += 1}`;

  // the first cell of each row is the title of the tab
  // Exclude the style variant div from being treated as a tab
  const tabItems = [...block.children]
    .filter((child) => {
      // Skip the style variant div
      if (child === tabsStyleDiv) return false;
      // Must have a firstElementChild with children
      return child && child.firstElementChild && child.firstElementChild.children.length > 0;
    })
    .map((child) => ({
      tabpanel: child,
      heading: child.firstElementChild,
    }));

  tabItems.forEach((item, i) => {
    const id = `tabpanel-${tabBlockCnt}-tab-${i + 1}`;
    const { tabpanel, heading: tab } = item;
    
    // For card-style-tab variant, reorganize content first
    if (cardStyleVariant) {
      // Find image and text content
      const picture = tabpanel.querySelector('picture');
      
      if (picture) {
        // Create wrapper for image
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'tabs-panel-image';
        
        // Extract picture - handle if it's wrapped in a p tag
        const pictureParent = picture.parentElement;
        let pictureElement;
        if (pictureParent && pictureParent.tagName === 'P') {
          // Extract the p tag containing picture
          pictureElement = pictureParent;
        } else {
          // Picture is direct child or in other structure
          pictureElement = picture;
        }
        
        // Move picture element to image wrapper
        imageWrapper.appendChild(pictureElement);
        
        // Create wrapper for content
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'tabs-panel-content';
        
        // Move all remaining children to content wrapper
        while (tabpanel.firstChild) {
          contentWrapper.appendChild(tabpanel.firstChild);
        }
        
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