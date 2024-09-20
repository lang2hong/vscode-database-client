<template>
  <div>
    
    <ViewerJson :disabled="disabled" :content='newContent' :remainHeight="remainHeight"></ViewerJson>
  </div>
</template>

<script>
import ViewerJson from '@/vue/redis/viewers/ViewerJson.vue';
import { ObjectInputStream } from 'java-object-serialization';
const JSONbig = require('@qii404/json-bigint')({ useNativeBigInt: false });
export default {
  data() {
    return {
      newContent:{}|null|''
    };
  },
  components: {
		ViewerJson,
	},
  props: {
    content: { default: () => Buffer.from('') },
    disabled: { type: Boolean, default: false },
    remainHeight: { type: Number, default: window.innerHeight - 100 }
  },
  watch: {
    content:{
      handler (newVal) {
        try {
          const result = (new ObjectInputStream(newVal)).readObject();
          if (typeof result !== 'object') {
            this.newContent = result;
            return;
          }
          const fields = Array.from(result.fields, ([key, value]) => ({ [key]: value }));
          this.newContent =JSONbig.stringify({ ...result, fields });
        } catch (e) {
          console.log("Java unserialize failed!",e);
          this.newContent = newVal;
        }
      },
      deep: true,
	    immediate: true,
    }
  },
  methods: {
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
