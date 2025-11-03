// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

export default async function decorate(block) {
  // Get the tabs style from data-aue-prop
  const tabsStyleParagraph = block.querySelector('p[data-aue-prop="tabsstyle"]');
  const tabsStyle = tabsStyleParagraph?.textContent?.trim() || '';
  
  // Add the style class to block
  if (tabsStyle && tabsStyle !== 'default' && tabsStyle !== '') {
    block.classList.add(tabsStyle);
  }
  
  // Proactively remove any style-config containers so they don't become tabs in AEM
  [...block.children]
    .filter((child) => child.querySelector('p[data-aue-prop="tabsstyle"]'))
    .forEach((cfg) => cfg.remove());

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
    .filter((child) => (
      child && child.firstElementChild
    ))
    .map((child) => ({
      tabpanel: child,
      heading: child.firstElementChild,
    }));

  tabItems.forEach((item, i) => {
    const id = `tabpanel-${tabBlockCnt}-tab-${i + 1}`;
    const { tabpanel, heading: tab } = item;
    
    // Store heading content before any DOM manipulation
    const headingContent = tab.innerHTML;
    
    // For card-style-tab variant, reorganize content first
    if (cardStyleVariant) {
      // Create wrapper for content (always)
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'tabs-panel-content';

      // Optional image wrapper if a picture is present
      const picture = tabpanel.querySelector('picture');
      let imageWrapper = null;
      if (picture) {
        imageWrapper = document.createElement('div');
        imageWrapper.className = 'tabs-panel-image';

        // Extract picture - handle if it's wrapped in a p tag
        const pictureParent = picture.parentElement;
        const pictureElement = (pictureParent && pictureParent.tagName === 'P') ? pictureParent : picture;
        imageWrapper.appendChild(pictureElement);
      }

      // Move all remaining children to content wrapper, excluding the heading
      const children = Array.from(tabpanel.children);
      children.forEach((child) => {
        if (child !== tab && child !== imageWrapper) {
          contentWrapper.appendChild(child);
        }
      });

      // Clear tabpanel and add wrappers back
      tabpanel.innerHTML = '';
      if (imageWrapper) {
        tabpanel.appendChild(imageWrapper);
        tabpanel.classList.remove('no-image');
      } else {
        tabpanel.classList.add('no-image');
      }
      tabpanel.appendChild(contentWrapper);
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

    button.innerHTML = headingContent;

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