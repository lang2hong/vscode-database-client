<template>
  <div>
    <JsonEditor ref='editor' :content='newContent' :readOnly='disabled||false' :remainHeight="remainHeight"></JsonEditor>
  </div>
</template>

 <script type="text/javascript">
import JsonEditor from '@/vue/redis/JsonEditor.vue';
import { ObjectInputStream } from 'java-object-serialization';
const JSONbig = require('@qii404/json-bigint')({ useNativeBigInt: false });
export default {
  data() {
    return {
    };
  },
  components: {
		JsonEditor,
	},
  props: {
    content: { default: () => Buffer.from('') },
    disabled: { type: Boolean, default: true },
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
    newContent(){
      try {
          const result = (new ObjectInputStream(this.content)).readObject();
          if (typeof result !== 'object') {
            return result;
          }
          const fields = Array.from(result.fields, ([key, value]) => ({ [key]: value }));
          return JSONbig.stringify({ ...result, fields });
        } catch (e) {
          console.log("Java unserialize failed!",e);
          this.$message.error("Java unserialize failed!");
          return "Java unserialize failed";
        }
    }
  },
  methods: {
    getContent() {
      this.$message.error('Java unserialization is readonly now!');
      return false;
    }
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
