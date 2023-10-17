const isDelimiter = (arg: number) => !( (arg >= 65 && arg <= 90) || (arg >= 97 && arg <= 122) || (arg >= 48 && arg <= 57) || arg == 95 );

const isOperator = (arg: string) => '!@$%^&*()-+={}[];:?<>.,|/'.indexOf(arg) > -1;

interface Token {
  lexeme: string
  start: number
  type: string
}

const keywords = [
  'while', 'for', 'match', 'on', 'if', 'else', 'then'
];

const special = [
  'self', 'result', 'error'
];

const decltype = [
  'let', 'var', 'proc', 'fn', 'type'
];

const datatype = [
  'string', 'int', 'real', 'bool', 'char', 'long', 'mod'
];

const bool = [
  'true', 'false'
];

function getTokenType(lexeme: string) {
  if (lexeme.startsWith('0x')) return 'number';
  if (lexeme.startsWith('0b')) return 'number';
  if (parseInt(lexeme).toString() == lexeme) return 'number';
  if (keywords.find(x => x == lexeme)) return 'keyword';
  if (special.find(x => x == lexeme)) return 'special';
  if (decltype.find(x => x == lexeme)) return 'decltype';
  if (datatype.find(x => x == lexeme)) return 'datatype';
  if (bool.find(x => x == lexeme)) return 'bool';
  else if (lexeme == 'import') return 'import';
  return 'identifier';
}

function makeToken(lexeme: string, start: number, op = false): Token {
  let type = op ? 'operator' : getTokenType(lexeme);
  return {
    lexeme: lexeme,
    start,
    type
  };
}

function tokenise(code: string) {
  let tokens: Token[] = [];
  let start = 0;
  let context = 'none';
  let quote = '';
  for (let i = 0; i < code.length; i++) {
    if (context == 'comment') {
      for (i; i < code.length && code.charAt(i) != '\n'; i++);
      tokens.push({lexeme: code.substring(start, i), start: 0, type: 'comment'});
      start = i;
    } else if (context == 'string') {
      for (i; i < code.length && code.charAt(i) != quote; i++);
      i++;
      tokens.push({lexeme: code.substring(start, i), start: 0, type: 'string'});
      start = i;
    }
    const charCode = code.charCodeAt(i);
    const char = code.charAt(i);
    let thisContext = 'none';
    if (!isDelimiter(charCode)) {
      thisContext = 'text';
    } else if (isOperator(char)) {
      thisContext = 'op';
    } else {
      if (char == '\n')
        thisContext = 'break';
      else if (char == '#')
        thisContext = 'comment';
      else if (char == '\"' || char == '\'') {
        thisContext = 'string';
        quote = char;
      }
      else thisContext = 'none';
    }
    if (thisContext != context) {
      if (context == 'none')
        tokens.push({ lexeme: code.substring(start, i), type: 'whitespace', start: 0 });
      else if (context == 'break')
        tokens.push({ lexeme: code.substring(start, i), type: 'line', start: 0 });
      else tokens.push(makeToken(code.substring(start, i), start, context == 'op'));
      start = i;
    }
    context = thisContext;
  }
  let codeBlock = document.querySelector('#code');
  if (!codeBlock) return;
  codeBlock.innerHTML = '';
  let list = document.createElement('table');
  let linenum = 0;
  codeBlock.appendChild(list);
  let row = document.createElement('tr');
  row.className = 'line';
  const number = document.createElement('td');
  number.innerHTML = linenum.toString();
  number.className = 'line-num';
  row.appendChild(number);
  list.appendChild(row);
  for (let token of tokens) {
    if (token.type == 'line') {
      linenum++;
      row = document.createElement('tr');
      row.className = 'line';
      list.appendChild(row);
      const number = document.createElement('td');
      number.className = 'line-num';
      number.innerHTML = linenum.toString();
      row.appendChild(number);
    } else {
      const span = document.createElement('pre');
      span.className = token.type;
      span.innerHTML = token.lexeme;
      row.appendChild(span);
    }
    //console.debug(token);
  }
}

function highlight() {
  let val = document.querySelector('#code-input');
  if (val) {
    tokenise((val as HTMLTextAreaElement).value);
  }
}
