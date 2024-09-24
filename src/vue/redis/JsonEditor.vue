<template>
  <div>
    <pre ref='editor' v-html="formatContent" :disabled="disabled" contenteditable="true" class="json-panel" @input="changeByJson" :style="'height:'+ remainHeight+'px'"></pre>
  </div>
</template>

<script>
import { objectUtil } from "@/vue/util/objectUtil";
import formatHighlight from "json-format-highlight";
const JSONbig = require('@qii404/json-bigint')({ useNativeBigInt: false });

export default {
  data() {
    return {
      editContent:null,
    };
  },
  props: {
    content: { default: () => Buffer.from('') },
    disabled: { type: Boolean, default: false },
    remainHeight: { type: Number, default: window.innerHeight - 100 }
  },
  watch: {
    content:{
      handler (newVal) {
      },
      deep: true,
	    immediate: true,
    }
  },
  computed: {
    formatContent(){
      this.editContent =  this.content;
      if(objectUtil.isJson(this.editContent)){
          return this.formatJsonContent(this.editContent);
      }
      return this.editContent;
    }
  },
  methods: {
    changeByJson(event) {
      this.editContent = JSONbig.stringify(JSONbig.parse(event.target.innerText), null, 0);
      // this.$emit("changeValue", this.editContent);
    },
    getContent(){
      return this.editContent;
    },
    formatJsonContent(content) {
      try {
        let colorOptions = {
          keyColor: "#0451a5",
          numberColor: "#098658",
          stringColor: "#a31515",
          trueColor: "#0000ff",
          falseColor: "#0000ff",
          nullColor: "#0000ff",
        };
        const darkTheme = {
          keyColor: "#9cdcfe",
          numberColor: "#9cdcfe",
          stringColor: "#ce9178",
          trueColor: "#569cd6",
          falseColor: "#569cd6",
          nullColor: "#569cd6",
        };
        if (document.body.dataset.vscodeThemeKind == "vscode-dark") {
          colorOptions =
            document.body.dataset.vscodeThemeName == "Dark (Visual Studio)"
              ? darkTheme
              : {
                  keyColor: "var(--vscode-terminal-ansiMagenta)",
                  trueColor: "var(--vscode-terminal-ansiBlue)",
                  falseColor: "var(--vscode-terminal-ansiBlue)",
                  nullColor: "var(--vscode-terminal-ansiBlue)",
                  stringColor: "var(--vscode-terminal-ansiGreen)",
                  numberColor: "var(--vscode-terminal-ansiYellow)",
                };
        }
        // return JSONbig.stringify(JSONbig.parse(content));
        return formatHighlight(JSONbig.parse(content), colorOptions);
      } catch (error) {
        console.log(error);
        this.$message.error("Json formatHighlight fail");
        return content;
      }
    },
  },
  mounted() {
    
  },
};
</script>
<style scoped>

.json-panel {
  overflow: scroll;
  line-height: 1.3;
  font-family: var(--vscode-editor-font-family);
  font-weight: var(--vscode-editor-font-weight);
  font-size: var(--vscode-editor-font-size);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 10px;
  outline: none;
}

.json-panel:focus {
  border-color: var(--umy-focus-color);
}
</style>
