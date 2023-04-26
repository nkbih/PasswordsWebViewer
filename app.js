function createCopyButton(html, label) {
    return createButton("password-item", label, html, () => {
      copyToClipboard(html);
    });
  }
  
  

function createElement(tag, attributes = {}, content = "") {
    const element = document.createElement(tag);
    for (const [attr, value] of Object.entries(attributes)) {
      element.setAttribute(attr, value);
    }
    element.innerHTML = content
    return element;
  }

  
function createButton(className, label, dataText, eventListener) {
  const button = createElement("button", {
    class: `item ${className}`,
    "data-clipboard-text": dataText,
    "aria-label": label,
  }, dataText);

  button.addEventListener("click", eventListener);
  return button;
}

function createRelatedPasswordsButton(username, passwords) {
  const relatedPasswords = getRelatedPasswords(username, passwords);

  if (relatedPasswords.length === 1) {
    return null;
  }
  
  const button = createElement("button", {
    class: "item related-passwords-button",
    "aria-label": "Показать связанные пароли",
  }, relatedPasswords.length);

  button.addEventListener("click", () => {
    showRelatedPasswords(username, passwords);
  });

  return button;
};


function parsePasswords(text) {
    const regex = /URL: (.*?)\nUsername: (.*?)\nPassword: (.*?)\nApplication:.*?/gs;
    const passwords = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        const url = new URL(match[1].startsWith("android://")
            ? `https://${match[1].split("@")[1]}`
            : match[1]).hostname.replace(/^www\./, "");
        passwords.push({
            url,
            username: match[2],
            password: match[3],
            });
    }

    return passwords;
}
  

function displayPasswords(passwords) {
  const passwordList = document.getElementById("password-list");
  passwordList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const originalPasswords = passwords.map((p) => p.password);
  const highlightedPasswords = highlightDifferences(originalPasswords);

  // Обновляем исходный массив объектов passwords с подсвеченными паролями
  passwords = passwords.map((passwordObj, index) => {
    return {
      ...passwordObj,
      password: highlightedPasswords[index],
    };
  });

  passwords.forEach(({ url, username, password }, index) => {
    const itemContainer = createElement("div", { class: "item-container" });
    const urlItem = createCopyButton(`${url}`, "URL");
    urlItem.classList.add("url-item");

    const usernameItem = createCopyButton(`${username}`, "login");
    const relatedPasswordsButton = createRelatedPasswordsButton(username, passwords);
    const usernameContainer = createElement("div", { class: "username-container" });
    usernameContainer.append(usernameItem);

    if (relatedPasswordsButton) {
      usernameContainer.appendChild(relatedPasswordsButton);
    }

    const passwordItem = createCopyButton(password, "password");

    itemContainer.append(urlItem, usernameContainer, passwordItem);
    fragment.appendChild(itemContainer);
  });

  passwordList.appendChild(fragment);
}


  

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleDrop(event) {
  event.preventDefault();
  if (event.dataTransfer.items) {
      const item = event.dataTransfer.items[0];
      if (item.kind === "file") {
          const file = item.getAsFile();
          readFile(file);
      }
  }
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
      const content = event.target.result;
      const passwordInput = document.getElementById('password-input');
      passwordInput.value = content;
      handleInput({ target: passwordInput });
  };
  reader.readAsText(file);
  }

function handleInput(event) {
  const inputText = event.target.value;
  const passwords = parsePasswords(inputText);
  displayPasswords(passwords);
  }




function copyToClipboard(html) {
  const textArea = document.createElement("textarea");
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = div.textContent || div.innerText || "";

  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Can't copy: ", err);
  }

  document.body.removeChild(textArea);
  }



function highlightDifferences(passwords) {
  const similarityThreshold = 0.75;

  function levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }

    return matrix[b.length][a.length];
  }

  function similarity(a, b) {
    const distance = levenshteinDistance(a, b);
    return 1 - distance / Math.max(a.length, b.length);
  }


  function findDifferences(a, b) {
    const diffIndexes = [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        diffIndexes.push(i);
      }
    }
    return diffIndexes;
  }

  const highlightedPasswords = passwords.map((password, index) => {
      let similarPassword = null;
  
      for (let i = 0; i < passwords.length; i++) {
        if (i !== index && similarity(password, passwords[i]) > similarityThreshold) {
          similarPassword = passwords[i];
          break;
        }
      }
  
      if (!similarPassword) {
        return password;
      }
  
      const diffIndexes = findDifferences(password, similarPassword);
      let highlightedPassword = "";
      let inHighlight = false;
  
      for (let i = 0; i < password.length; i++) {
        if (diffIndexes.includes(i)) {
          if (!inHighlight) {
              highlightedPassword += `<span class="different">`;
              inHighlight = true;
          }
        } else {
          if (inHighlight) {
            highlightedPassword += "</span>";
            inHighlight = false;
          }
        }
  
        highlightedPassword += password[i];
      }
  
      if (inHighlight) {
        highlightedPassword += "</span>";
      }
  
      return highlightedPassword;
    });
  
    return highlightedPasswords;
  }
  


function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "block";
  setTimeout(() => {
    modal.classList.add("modal-open");
  }, 50);

  window.addEventListener("click", windowClickHandler);

  function windowClickHandler(event) {
    if (event.target === modal) {
      closeModal(modalId);
      window.removeEventListener("click", windowClickHandler);
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("modal-open");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

function getRelatedPasswords(username, passwords) {
  const related = passwords.filter(p => p.username === username);
  const uniqueRelated = [];

  related.forEach(passwordObj => {
    const existing = uniqueRelated.find(
      p => p.password.replace(/<\/?span[^>]*>/g, "") === passwordObj.password.replace(/<\/?span[^>]*>/g, "")
    );
    if (!existing) {
      uniqueRelated.push(passwordObj);
    }
  });

  return uniqueRelated;
}

function showRelatedPasswords(username, passwords) {
  const relatedPasswords = getRelatedPasswords(username, passwords);
  const passwordList = document.getElementById("related-password-list");
  passwordList.innerHTML = "";

  // Установить имя пользователя
  const relatedUsername = document.getElementById("related-username");
  relatedUsername.textContent = username;

  const fragment = document.createDocumentFragment();

  relatedPasswords.forEach(({ password }) => {
    const passwordItem = createCopyButton(password, "related-password");
    passwordItem.classList.add("modal-item");
    fragment.appendChild(passwordItem);
  });

  passwordList.appendChild(fragment);

  // Открыть модальное окно
  openModal("related-password-modal");
}




function getSortingSettings() {
  const sortingSettings = [
    {
      domain: "accounts.google.com",
      priority: 1,
    },
    {
      domain: "steamcommunity.com",
      priority: 2,
    },
    {
      domain: "login.live.com",
      priority: 3,
    },
  ];

  return sortingSettings;
}

document.addEventListener("DOMContentLoaded", function () {

  const inputField = document.getElementById("password-input");
  inputField.addEventListener("input", handleInput);
  inputField.addEventListener("change", handleInput);

});