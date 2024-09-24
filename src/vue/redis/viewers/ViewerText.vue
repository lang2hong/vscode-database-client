<template>
  <div>
    <!-- </textarea> -->
    <el-input ref='editor' class="readonly" type='textarea' :autosize="autosize" :disabled="disabled" v-model='editContent' :style="'height:' + remainHeight + 'px'"></el-input>
  </div>
</template>

<script>
import { objectUtil } from "@/vue/util/objectUtil";
export default {
  data() {
    return {
      autosize: {
        minRows: 30
      },
      editContent:null
    };
  },
  props: {
    content: { default: () => Buffer.from('') },
    disabled: { type: Boolean, default: false },
    remainHeight: { type: Number, default: window.innerHeight - 100 }
  },
  watch: {
    content: {
      handler(newVal) {
        this.editContent = this.content.toString('utf8');
      },
      deep: true,
      immediate: true,
    }
  },
  computed: {
  },
  methods: {
    getContent() {
      return this.editContent;
    },
  },
  mounted() {
    this.editContent = this.content.toString('utf8');
    // console.log("ViewerText content",this.content);
  },
};
</script>

<style scoped>
:deep(.readonly .el-textarea__inner) {
    background-color: var(--vscode-editor-background);
    font-family: var(--vscode-editor-font-family);
    font-weight: var(--vscode-editor-font-weight);
    font-size: var(--vscode-editor-font-size);
    color: var(--vscode-foreground);
}
</style>
