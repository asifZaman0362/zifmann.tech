function toggleTheme() {
  var theme = localStorage.getItem("theme") ?? "light";
  console.log(theme);
  let newTheme = theme == "light" ? "dark" : "light";
  document.body.classList.replace(theme, newTheme);
  theme = newTheme;
  localStorage.setItem("theme", theme);
}

function toggleSidebar() {
  let overview = document.querySelector("#overview");
  if (!overview) overview = document.querySelector("#timeline");
  let button = document.querySelector("#toggle-sidebar");
  if (!overview.classList.contains('hidden')) {
    overview.classList.add('hidden');
    button.innerHTML = "menu";
  } else {
    overview.classList.remove('hidden');
    button.innerHTML = "close";
  }
}

function gen_outline_tree(parent, node) {
  let wrapper = document.createElement('li');
  let anchor = document.createElement('a');
  anchor.href = `#${node.link}`;
  anchor.onclick = () => toggleSidebar();
  let newNode = document.createElement(`H${node.level}`);
  anchor.appendChild(newNode);
  wrapper.appendChild(anchor);
  newNode.innerHTML = node.text;
  if (node.children.length > 0) {
    console.log('yo');
    let ul = document.createElement('ul');
    for (let c of node.children) {
      gen_outline_tree(ul, c);
    }
    wrapper.appendChild(ul);
  }
  parent.appendChild(wrapper);
}

function create_outline() {
  let article = document.querySelector("article");
  if (article == null) {
    return;
  }
  let p = { text: null, children: [], parent: null, level: 0, link: null };
  let latest = p;
  for (let child of article.children) {
    let targetLevel = 1;
    if (child.tagName.toLowerCase() == "h2") {
      targetLevel = 2;
    } else if (child.tagName.toLowerCase() == "h3") {
      targetLevel = 3;
    } else if (child.tagName.toLowerCase() == "h4") {
      targetLevel = 4;
    } else {
      continue;
    }
    console.log(targetLevel, "vs", latest.level);
    let id = child.querySelector('a').id;
    let regex = /<a\b[^>]*>(.*?)<\/a>/g;
    let element = { text: child.innerHTML.replace(regex, ''), parent: null, children: [], level: targetLevel, link: id };
    if (!latest.text) {
      element.parent = p;
      latest.children.push(element);
      console.log('adding to root');
    } else {
      if (latest.level == targetLevel) {
        element.parent = latest.parent;
        latest.parent.children.push(element);
      } else if (latest.level < targetLevel) {
        element.parent = latest;
        latest.children.push(element);
      } else {
        while (latest.parent && latest.level > targetLevel) latest = latest.parent;
        element.parent = latest.parent;
        latest.parent.children.push(element);
      }
    }
    latest = element;
  }
  let outline_dom_root = document.querySelector('#outline');
  for (let c of p.children) {
    gen_outline_tree(outline_dom_root, c);
  }
  return p;
}

window.onload = () => {
  var theme = localStorage.getItem("theme") ?? "light";
  document.body.className = theme;
  document.querySelector("#theme-toggle").setAttribute("checked", theme == "dark");
  create_outline()
}
