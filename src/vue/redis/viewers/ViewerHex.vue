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
        this.editContent = objectUtil.bufToString(newVal);;
      },
      deep: true,
	    immediate: true,
    }
  },
  computed:{

  },
  methods: {
    getContent() {
      return objectUtil.xToBuffer(this.editContent);
    },
  },
  mounted() {
    this.editContent = objectUtil.bufToString(this.content);;
  },
};
</script>
