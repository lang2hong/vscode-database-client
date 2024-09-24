<template>
  <div>
    <JsonEditor ref='editor' :content='newContent' :readOnly='disabled||false' :remainHeight="remainHeight"></JsonEditor>
  </div>
</template>

<script>
import JsonEditor from '@/vue/redis/JsonEditor.vue';
import { objectUtil } from "@/vue/util/objectUtil";
const JSONbig = require('@qii404/json-bigint')({ useNativeBigInt: false });
export default {
  data() {
    return {
    };
  },
  props: {
    content: { default: () => Buffer.from('') },
    disabled: { type: Boolean, default: false },
    remainHeight: { type: Number, default: window.innerHeight - 100 }
  },
  components: {
		JsonEditor,
	},
  watch: {
    content:{
      handler (newVal) {
        
      },
      deep: true,
	    immediate: true,
    }
  },
  computed:{
    newContent(){
        const { formatStr } = this;
        if (typeof formatStr === 'string') {
          return formatStr;
        }
        this.newContent = 'Zlib Brotli Parse Failed!';
    },
    formatStr() {
      return objectUtil.zippedToString(this.content, 'brotli');
    },
  },
  methods: {
    getContent() {
      const content = this.$refs.editor.getContent();
      return zlib.brotliCompressSync(content);
    }
  },
  mounted() {
    // console.log("ViewerText content",this.content);
  },
};
</script>
