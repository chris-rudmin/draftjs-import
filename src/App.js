import React from 'react';
import {CompositeDecorator, Editor, EditorState, Modifier, convertFromHTML, ContentState, DefaultDraftBlockRenderMap, getSafeBodyFromHTML} from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';
import "./styles.css";
import DOMPurify from 'dompurify'

const Link = ({ entityKey, contentState, children }) => {
  let { url } = contentState.getEntity(entityKey).getData();
  return (
    <a
      rel="noopener noreferrer"
      href={url}
      target="_blank"
    >
      {children}
    </a>
  )
};

const findLinkEntities = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity()
    return (
      entityKey !== null && contentState.getEntity(entityKey).getType() === "LINK"
    )
  }, callback);
};

// const onAddLink = (editorState, setEditorState) => {
//   const decorator = createLinkDecorator();
//   if (linkUrl) {
//     let displayLink = window.prompt("Display Text");
//     if (displayLink) {
//       const currentContent = editorState.getCurrentContent();
//       const createEntity = currentContent.createEntity("LINK", "MUTABLE", {
//         url: linkUrl,
//       });
//       let entityKey = currentContent.getLastCreatedEntityKey();
//       const selection = editorState.getSelection();
//       const textWithEntity = Modifier.insertText(
//         currentContent,
//         selection,
//         displayLink,
//         null,
//         entityKey
//       );
//       let newState = EditorState.createWithContent(textWithEntity, decorator);
//       setEditorState(newState);
//     }
//   }
// };

const DOMPurifyConfig = {
  ALLOWED_TAGS: ['p','a','ol','ul','li','a','br','h1','h2','h3','#text'],
  ALLOWED_ATTR: ['href', 'rel', 'target'],
}

const DOMPurifyString = {
  ALLOWED_TAGS: ['#text'],
  ALLOWED_ATTR: [],
}

const testString = `<p>😃</p>
<h1>H1</h1>
<h2>H2</h2>
<h3>H3</h3>
<p><br></p>
<p>Visit <a target="_blank" rel="noopener noreferrer" href="https://podcastchoices.com/adchoices">podcastchoices.com/adchoices</a></p>
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

const decorator = new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: Link,
  }
])


export default class App extends React.Component {
  constructor() {
    super();

    const blockRenderMap = DefaultDraftBlockRenderMap.set('p', { element: 'p' });
    const blocksFromHTML = convertFromHTML(testString, getSafeBodyFromHTML, blockRenderMap)
    const state = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks.map(block => block.get('type') === 'p' ? block.set('type', 'unstyled') : block),
      blocksFromHTML.entityMap,
    );

    this.state = {
      rteValue: EditorState.createWithContent(state, decorator),
      textAreaValue: testString,
    };
  }

  renderHTMLString(string) {
    const blocksFromHTML = convertFromHTML(string);
    const contentState = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks,
      blocksFromHTML.entityMap,
    );

    this.setState((state) => ({
      rteValue: EditorState.createWithContent(contentState, decorator),
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
    this.renderHTMLString(testString)
  }

  loadExploitHTML() {
    this.renderHTMLString(expoitString)
  }

  onChangeRTE(value) {
    this.setState((state) => ({
      rteValue: value,
      textAreaValue: stateToHTML(value.getCurrentContent())
    }))
  }

  onChangeTextArea(event) {
    this.renderHTMLString(event.target.value)
  }

  render() {
    return (
      <>
        <Editor
          editorState={this.state.rteValue}
          placeholder="Podcast description"
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
