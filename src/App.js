import React from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  convertFromHTML,
  CompositeDecorator,
  ContentState
} from "draft-js";
import "./styles.css";
import 'draft-js/dist/Draft.css';
import DOMPurify from 'dompurify'


const testString = `
  <p>😃</p>
  <p><a href="https://www.thehotline.org/get-help/">National Domestic Violence Hotline</a>: 1-800-799-SAFE (7233); for TTY: 1-800-787-3224</p><p>Text “START” to 88788</p>
  <p><a href="https://suicidepreventionlifeline.org/talk-to-someone-now/">National Suicide Prevention Lifeline</a>: 1-800-273-8255</p>
  <p>Nacional de Prevención del Suicidio: 1-888-628-9454</p><p>For TTY Users: Use your preferred relay service or dial 711 then 1-800-273-8255.</p>
  <p><br></p>
  <p>Source materials for this episode cannot be listed here due to character limitations. For a full list of sources, please visit <a href="https://crimejunkiepodcast.com/mysterious-death-ellen-greenberg/">https://crimejunkiepodcast.com/mysterious-death-ellen-greenberg/</a></p>
  <p><br></p>
  <p>Learn more about your ad choices. Visit <a href="https://podcastchoices.com/adchoices">podcastchoices.com/adchoices</a></p>
  <ul><li>one</li><li>two</li></ul>
  <ol><li>one</li><li>two</li></ol>
  <b>dangling tag
  <div>what</div>
  No Tag
  <img src=x onerror=alert(1)//>
  <svg><g/onload=alert(2)//<p>
  <p>abc<iframe//src=jAva&Tab;script:alert(3)>def</p>
  <math><mi//xlink:href="data:x,<script>alert(4)</script>">
  <TABLE><tr><td>HELLO</tr></TABL>
  <UL><li><A HREF=//google.com>click</UL>
`


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      inputValue: testString,
    };

    this.focus = () => this.refs.editor.focus();
    this.onChange = (editorState) =>
      this.setState((state) => ({ ...state, editorState }));

    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
  }

  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  _mapKeyToEditorCommand(e) {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(
        e,
        this.state.editorState,
        4 /* maxDepth */
      );
      if (newEditorState !== this.state.editorState) {
        this.onChange(newEditorState);
      }
      return;
    }
    return getDefaultKeyBinding(e);
  }

  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  }

  handleChange(e) {
    this.setState((state) => ({ ...state, inputValue: e.target.value }));
  }

  purifyHtml() {
    this.setState((state) => ({
      ...state, inputValue: DOMPurify.sanitize(state.inputValue)
    }))
  }

  importHtml() {
    const decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: Link
      },
      {
        strategy: findImageEntities,
        component: Image
      }
    ]);


    const blocksFromHTML = convertFromHTML(this.state.inputValue);
    const blockState = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks,
      blocksFromHTML.entityMap
    );

    this.setState((state) => ({
      ...state,
      editorState: EditorState.createWithContent(blockState, decorator)
    }));
  }

  render() {
    const { editorState } = this.state;

    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = "RichEditor-editor";
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== "unstyled") {
        className += " RichEditor-hidePlaceholder";
      }
    }

    return (
      <>
        <div className="RichEditor-root">
          <BlockStyleControls
            editorState={editorState}
            onToggle={this.toggleBlockType}
          />
          <InlineStyleControls
            editorState={editorState}
            onToggle={this.toggleInlineStyle}
          />
          <div className={className} onClick={this.focus}>
            <Editor
              blockStyleFn={getBlockStyle}
              customStyleMap={styleMap}
              editorState={editorState}
              handleKeyCommand={this.handleKeyCommand}
              keyBindingFn={this.mapKeyToEditorCommand}
              onChange={this.onChange}
              placeholder="Tell a story..."
              ref="editor"
              spellCheck={true}
              readOnly
            />
          </div>
        </div>
        <hr/>
        <textarea type="text" onChange={this.handleChange.bind(this)} rows={10} defaultValue={testString} />
        <button onClick={this.purifyHtml.bind(this)}>Sanitize HTML</button>
        <button onClick={this.importHtml.bind(this)}>Import HTML</button>
      </>
    );
  }
}

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2
  }
};

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "LINK"
    );
  }, callback);
}

const Link = (props) => {
  const { url } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={url} style={styles.link}>
      {props.children}
    </a>
  );
};

function findImageEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "IMAGE"
    );
  }, callback);
}

const Image = (props) => {
  const { height, src, width } = props.contentState
    .getEntity(props.entityKey)
    .getData();

  return <img src={src} height={height} width={width} alt="test" />;
};

const styles = {
  root: {
    fontFamily: "'Helvetica', sans-serif",
    padding: 20,
    width: 600
  },
  editor: {
    border: "1px solid #ccc",
    cursor: "text",
    minHeight: 80,
    padding: 10
  },
  button: {
    marginTop: 10,
    textAlign: "center"
  }
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case "blockquote":
      return "RichEditor-blockquote";
    default:
      return null;
  }
}

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = "RichEditor-styleButton";
    if (this.props.active) {
      className += " RichEditor-activeButton";
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

const BLOCK_TYPES = [
  { label: "H1", style: "header-one" },
  { label: "H2", style: "header-two" },
  { label: "H3", style: "header-three" },
  { label: "H4", style: "header-four" },
  { label: "H5", style: "header-five" },
  { label: "H6", style: "header-six" },
  { label: "Blockquote", style: "blockquote" },
  { label: "UL", style: "unordered-list-item" },
  { label: "OL", style: "ordered-list-item" },
  { label: "Code Block", style: "code-block" }
];

const BlockStyleControls = (props) => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

var INLINE_STYLES = [
  { label: "Bold", style: "BOLD" },
  { label: "Italic", style: "ITALIC" },
  { label: "Underline", style: "UNDERLINE" },
  { label: "Monospace", style: "CODE" }
];

const InlineStyleControls = (props) => {
  const currentStyle = props.editorState.getCurrentInlineStyle();

  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};
