function createCopyButton(html, label) {
    const item = document.createElement("button");
    item.innerHTML = html;
    item.className = "password-item";
    item.setAttribute("data-clipboard-text", item.textContent);
    item.setAttribute("aria-label", label);
  
    item.addEventListener("click", () => {
      copyToClipboard(item.textContent);
    });
  
    return item;
  }
  
  
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

    passwords.forEach(({ url, username, password }, index) => {

        const itemContainer = document.createElement("div");
        itemContainer.className = "item-container";

        const urlItem = createCopyButton(`${url}`, "URL");
        urlItem.classList.add("url-item"); // добавляем класс url-item

        const usernameItem = createCopyButton(`${username}`, "Логин");

        const highlightedPasswords = highlightDifferences(passwords.map(p => p.password));
        const passwordItem = createCopyButton(highlightedPasswords[index], "Пароль");


        itemContainer.appendChild(urlItem);
        itemContainer.appendChild(usernameItem);
        itemContainer.appendChild(passwordItem);

        passwordList.appendChild(itemContainer);
    });
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleDrop(event) {
    event.preventDefault();
    if (event.dataTransfer.items) {
        const file = event.dataTransfer.items[0].getAsFile();
        readFile(file);
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




function copyToClipboard(text) {
    const textArea = document.createElement("textarea");
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
    const similarityThreshold = 0.7;
  
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
              highlightedPassword += '<span class="different">';
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
  



document.addEventListener("DOMContentLoaded", function () {
    const inputField = document.getElementById("password-input");
    inputField.addEventListener("input", handleInput);
    inputField.addEventListener("change", handleInput);
  });