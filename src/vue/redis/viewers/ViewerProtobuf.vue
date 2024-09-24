<template>
  <div>
    <JsonEditor ref='editor' :content='content' :readOnly='disabled||false' :remainHeight="remainHeight" class='protobuf-viewer'>
      <div class="viewer-protobuf-header">
      <!-- type selector -->
      <el-select v-model="selectedType" filterable placeholder="Select Type" size="mini" class="type-selector">
        <el-option
          v-for="t of types"
          :key="t"
          :label="t"
          :value="t">
        </el-option>
      </el-select>
      <!-- select proto file -->
      <el-button class="select-proto-btn" type='primary' size="mini" icon="el-icon-upload2" @click="selectProto">Select Proto Files</el-button>
    </div>
    <!-- selected files -->
    <!-- <el-tag v-for="p of proto" :key="p" class="selected-proto-file-tag">{{ p }}</el-tag> -->
    <hr>
    </JsonEditor>
  </div>
</template>

<script>
import JsonEditor from '@/vue/redis/JsonEditor.vue';
import { getData } from 'rawproto';
// import * as protobuf from 'protobufjs';
const protobuf = require('protobufjs/minimal');
const { dialog } = require('electron').remote;

export default {
  data() {
    return {
      proto: [],
      protoRoot: null,
      types: ['Rawproto'],
      selectedType: 'Rawproto',
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
    newContent() {
      try {
        if (this.selectedType === 'Rawproto') {
          return getData(this.content);
        }
        const type = this.protoRoot.lookupType(this.selectedType);
        const message = type.decode(this.content);
        return message.toJSON();
      } catch (e) {
        return 'Protobuf Decode Failed!';
      }
    },
  },
  methods: {
    traverseTypes(current) {
      if (current instanceof protobuf.Type) {
        this.types.push(current.fullName);
      }
      if (current.nestedArray) {
        current.nestedArray.forEach((nested) => {
          this.traverseTypes(nested);
        });
      }
    },
    selectProto() {
      dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: '.proto',
            extensions: ['proto'],
          },
        ],
      }).then((result) => {
        if (result.canceled) return;
        this.proto = result.filePaths;
        this.types = ['Rawproto'];
        this.selectedType = 'Rawproto';

        protobuf.load(this.proto).then((root) => {
          this.protoRoot = root;
          // init types
          this.traverseTypes(root);
          // first type as default
          if (this.types.length > 0) {
            this.selectedType = this.types[1];
          }
        }).catch((e) => {
          this.$message.error(e.message);
        });
      }).catch((e) => {
        this.$message.error(e.message);
      });
    },
    getContent() {
      if (!this.protoRoot) {
        this.$message.error('Select a correct .proto file');
        return false;
      }

      if (!this.selectedType || this.selectedType === 'Rawproto') {
        this.$message.error('Select a correct Type to encode');
        return false;
      }

      let content = this.$refs.editor.getContent();
      const type = this.protoRoot.lookupType(this.selectedType);

      try {
        content = JSON.parse(content);
        const err = type.verify(content);
        if (err) {
          this.$message.error(`Proto Verify Failed: ${err}`);
          return false;
        }
        const message = type.create(content);
        return type.encode(message).finish();
      } catch (e) {
        console.log(error);
        this.$message.error("Json format fail");
        return false;
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
