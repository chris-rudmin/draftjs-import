import React from 'react';
import RichTextEditor from 'react-rte';
import "./styles.css";
import DOMPurify from 'dompurify'

const DOMPurifyConfig = {
  ALLOWED_TAGS: ['p','a','ol','ul','li','a','br','h1','h2','h3','#text'],
  ALLOWED_ATTR: ['href', 'rel', 'target'],
}

const DOMPurifyString = {
  ALLOWED_TAGS: ['#text'],
  ALLOWED_ATTR: [],
}

const toolbarConfig = {
  // Optionally specify the groups to display (displayed in the order listed).
  display: ['BLOCK_TYPE_BUTTONS', 'LINK_BUTTONS', 'BLOCK_TYPE_DROPDOWN', 'HISTORY_BUTTONS'],
  BLOCK_TYPE_DROPDOWN: [
    {label: 'Normal', style: 'unstyled'},
    {label: 'Heading Large', style: 'header-one'},
    {label: 'Heading Medium', style: 'header-two'},
    {label: 'Heading Small', style: 'header-three'}
  ],
  BLOCK_TYPE_BUTTONS: [
    {label: 'UL', style: 'unordered-list-item'},
    {label: 'OL', style: 'ordered-list-item'}
  ]
};

const testString = `<p>😃</p>
<h1>H1</h1>
<h2>H2</h2>
<h3>H3</h3>
<p><br></p>
<p>Visit <a href="https://podcastchoices.com/adchoices">podcastchoices.com/adchoices</a></p>
<ul>
  <li>one</li>
  <li>two</li>
</ul>
<ol>
  <li>one</li>
  <li>two</li>
</ol>`

const expoitString = `<p>☟ Unsupported HTML ☟</p>
<b>bold</b>
<i>italic</i>
<div>div</div>
<img src=x onerror=alert(1)//>
<svg><g/onload=alert(2)//<p>
<p>abc<iframe//src=jAva&Tab;script:alert(3)>def</p>
<math><mi//xlink:href="data:x,<script>alert(4)</script>">
<TABLE><tr><td>HELLO</tr></TABL>
<UL><li><A HREF=//google.com>click</UL>`


export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      rteValue: RichTextEditor.createEmptyValue().setContentFromString(expoitString, 'html'),
      textAreaValue: expoitString,
    };
  }

  renderHTMLString(string) {
    this.setState((state) => ({
      rteValue: state.rteValue.setContentFromString(string, 'html'),
      textAreaValue: string
    }))
  }

  purifyHtml() {
    this.renderHTMLString(DOMPurify.sanitize(this.state.textAreaValue, DOMPurifyConfig))
  }

  getPlainText() {
    this.renderHTMLString(DOMPurify.sanitize(this.state.textAreaValue, DOMPurifyString))
  }

  loadSafeHtml() {
    this.setState((state) => ({ rteValue: state.rteValue.setContentFromString(testString, 'html'), textAreaValue: testString }));
  }

  loadExploitHTML() {
    this.setState((state) => ({ rteValue: state.rteValue.setContentFromString(expoitString, 'html'), textAreaValue: expoitString }));
  }

  onChangeRTE(value) {
    this.setState((state) => ({ rteValue: value, textAreaValue: state.rteValue.toString('html')}))
  }

  onChangeTextArea(event) {
    this.setState((state) => ({ rteValue: state.rteValue.setContentFromString(event.target.value, 'html'), textAreaValue: event.target.value}))
  }

  render() {
    return (
      <>
        <RichTextEditor
          value={this.state.rteValue}
          placeholder="Podcast description"
          toolbarConfig={toolbarConfig}
          onChange={this.onChangeRTE.bind(this)}
        />
        <hr/>
        <label for="raw">HTML:</label>
        <textarea type="text" name="raw" rows={10} value={this.state.textAreaValue} onChange={this.onChangeTextArea.bind(this)}/>
        <button onClick={this.loadSafeHtml.bind(this)}>Load Safe HTML</button>
        <button onClick={this.loadExploitHTML.bind(this)}>Load Exploit HTML</button>
        <button onClick={this.getPlainText.bind(this)}>Render Plain Text</button>
        <button onClick={this.purifyHtml.bind(this)}>Sanitize HTML</button>
      </>
    );
  }
}
