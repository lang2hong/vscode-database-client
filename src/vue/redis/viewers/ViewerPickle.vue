<template>
  <div>
    <JsonEditor ref='editor' :content='content' :readOnly='disabled||false' :remainHeight="remainHeight"></JsonEditor>
  </div>
</template>

<script>
import JsonEditor from '@/vue/redis/JsonEditor.vue';
import { Parser } from 'pickleparser';
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
        return (new Parser()).parse(this.content);
      } catch (e) {
        return 'Pickle parsed failed!';
      }
    }
  },
  methods: {
    getContent() {
      this.$message.error('Pickle is readonly now!');
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
