<template>
  <div>
    <JsonEditor ref='editor' :content='newContent' :readOnly='disabled||false' :remainHeight="remainHeight"></JsonEditor>
  </div>
</template>

<script>
import JsonEditor from '@/vue/redis/JsonEditor.vue';
import { objectUtil } from "@/vue/util/objectUtil";
import { unserialize, serialize } from 'php-serialize';
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
      try {
        const content = unserialize(this.content, {}, { strict: false });
        // include php native class, into readonly mode
        if (content['__PHP_Incomplete_Class_Name']) {
          this.isPHPClass = true;
        }
        return content;
      } catch (e) {
        console.log("php unserialize format failed!",e);
        this.$message.error("php unserialize format failed!");
        return "php unserialize format failed";
      }
    },
  },
  methods: {
    getContent() {
      const content = this.$refs.editor.getContent();
      // raw content is an object
      if (typeof this.newContent !== 'string') {
        try {
          content = JSON.parse(content);
        } catch (e) {
          // object parse failed
          this.$message.error({
            message: `Raw content is an object, but now parse object failed: ${e.message}`,
            duration: 6000,
          });

          return false;
        }
      }
      return serialize(content);
    }
  },
  mounted() {
    // console.log("ViewerText content",this.content);
  },
};
</script>
