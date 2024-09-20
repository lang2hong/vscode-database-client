<template>
  <div>
    <!-- </textarea> -->
    <el-input type='textarea' :autosize="autosize" :disabled="disabled" v-model='tempContent' @input="chanageValue()" :style="'height:'+ remainHeight+'px'"></el-input>
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
        this.tempContent = objectUtil.bufToString(newVal);;
      },
      deep: true,
	    immediate: true,
    }
  },
  computed:{

  },
  methods: {
  },
  mounted() {
    // console.log("ViewerText content",this.content);
  },
};
</script>
