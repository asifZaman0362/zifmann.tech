var isDelimiter = function (arg) { return !((arg >= 65 && arg <= 90) || (arg >= 97 && arg <= 122) || (arg >= 48 && arg <= 57) || arg == 95); };
var isOperator = function (arg) { return '!@$%^&*()-+={}[];:?<>.,|/'.indexOf(arg) > -1; };
var keywords = [
    'while', 'for', 'match', 'on', 'if', 'else', 'then'
];
var special = [
    'self', 'result', 'error'
];
var decltype = [
    'let', 'var', 'proc', 'fn', 'type'
];
var datatype = [
    'string', 'int', 'real', 'bool', 'char', 'long', 'mod'
];
var bool = [
    'true', 'false'
];
function getTokenType(lexeme) {
    if (lexeme.startsWith('0x'))
        return 'number';
    if (lexeme.startsWith('0b'))
        return 'number';
    if (parseInt(lexeme).toString() == lexeme)
        return 'number';
    if (keywords.find(function (x) { return x == lexeme; }))
        return 'keyword';
    if (special.find(function (x) { return x == lexeme; }))
        return 'special';
    if (decltype.find(function (x) { return x == lexeme; }))
        return 'decltype';
    if (datatype.find(function (x) { return x == lexeme; }))
        return 'datatype';
    if (bool.find(function (x) { return x == lexeme; }))
        return 'bool';
    else if (lexeme == 'import')
        return 'import';
    return 'identifier';
}
function makeToken(lexeme, start, op) {
    if (op === void 0) { op = false; }
    var type = op ? 'operator' : getTokenType(lexeme);
    return {
        lexeme: lexeme,
        start: start,
        type: type
    };
}
function tokenise(code) {
    var tokens = [];
    var start = 0;
    var context = 'none';
    var quote = '';
    for (var i = 0; i < code.length; i++) {
        if (context == 'comment') {
            for (i; i < code.length && code.charAt(i) != '\n'; i++)
                ;
            tokens.push({ lexeme: code.substring(start, i), start: 0, type: 'comment' });
            start = i;
        }
        else if (context == 'string') {
            for (i; i < code.length && code.charAt(i) != quote; i++)
                ;
            i++;
            tokens.push({ lexeme: code.substring(start, i), start: 0, type: 'string' });
            start = i;
        }
        var charCode = code.charCodeAt(i);
        var char = code.charAt(i);
        var thisContext = 'none';
        if (!isDelimiter(charCode)) {
            thisContext = 'text';
        }
        else if (isOperator(char)) {
            thisContext = 'op';
        }
        else {
            if (char == '\n')
                thisContext = 'break';
            else if (char == '#')
                thisContext = 'comment';
            else if (char == '\"' || char == '\'') {
                thisContext = 'string';
                quote = char;
            }
            else
                thisContext = 'none';
        }
        if (thisContext != context) {
            if (context == 'none')
                tokens.push({ lexeme: code.substring(start, i), type: 'whitespace', start: 0 });
            else if (context == 'break')
                tokens.push({ lexeme: code.substring(start, i), type: 'line', start: 0 });
            else
                tokens.push(makeToken(code.substring(start, i), start, context == 'op'));
            start = i;
        }
        context = thisContext;
    }
    var codeBlock = document.querySelector('#code');
    if (!codeBlock)
        return;
    codeBlock.innerHTML = '';
    var list = document.createElement('table');
    var linenum = 0;
    codeBlock.appendChild(list);
    var row = document.createElement('tr');
    row.className = 'line';
    var number = document.createElement('td');
    number.innerHTML = linenum.toString();
    number.className = 'line-num';
    row.appendChild(number);
    list.appendChild(row);
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (token.type == 'line') {
            linenum++;
            row = document.createElement('tr');
            row.className = 'line';
            list.appendChild(row);
            var number_1 = document.createElement('td');
            number_1.className = 'line-num';
            number_1.innerHTML = linenum.toString();
            row.appendChild(number_1);
        }
        else {
            var span = document.createElement('pre');
            span.className = token.type;
            span.innerHTML = token.lexeme;
            row.appendChild(span);
        }
        //console.debug(token);
    }
}
function highlight() {
    var val = document.querySelector('#code-input');
    if (val) {
        tokenise(val.value);
    }
}
