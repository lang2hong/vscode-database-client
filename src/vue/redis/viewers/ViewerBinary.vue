<template>
  <div>
    <!-- </textarea> -->
    <el-input ref='editor' type='textarea' :autosize="autosize" :disabled="disabled" v-model='editContent' :style="'height:' + remainHeight + 'px'"></el-input>
  </div>
</template>

<script>
import { objectUtil } from "@/vue/util/objectUtil";
export default {
  data() {
    return {
      tempContent:null,
      autosize: {
        minRows: 30
      }
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
        this.editContent = objectUtil.bufToBinary(newVal);
      },
      deep: true,
	    immediate: true,
    }
  },
  computed:{
  },
  methods: {
    getContent() {
      return objectUtil.binaryStringToBuffer(this.editContent);
    },
  },
  mounted() {
    this.editContent = objectUtil.bufToBinary(this.content);;
  },
};
</script>
