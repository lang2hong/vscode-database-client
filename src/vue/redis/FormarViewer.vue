<template>
	<div>
		<component ref='viewer' 
			:is='viewerComponent' 
			:content='newContent' 
			:name="viewerComponent" 
			:remainHeight="remainHeight"
			>
		</component>
	</div>
</template>
  
<script>
import ViewerJson from '@/vue/redis/viewers/ViewerJson.vue';
import ViewerText from '@/vue/redis/viewers/ViewerText.vue';
import ViewerJavaSerialize from '@/vue/redis/viewers/ViewerJavaSerialize.vue';
import ViewerHex from '@/vue/redis/viewers/ViewerHex.vue';
import ViewerBinary from '@/vue/redis/viewers/ViewerBinary.vue';
import ViewerBrotli from '@/vue/redis/viewers/ViewerBrotli.vue';
import ViewerDeflate from '@/vue/redis/viewers/ViewerDeflate.vue';
import ViewerDeflateRaw from '@/vue/redis/viewers/ViewerDeflateRaw.vue';
import ViewerGzip from '@/vue/redis/viewers/ViewerGzip.vue';
import ViewerPHPSerialize from '@/vue/redis/viewers/ViewerPHPSerialize.vue';
// import ViewerPickle from '@/vue/redis/viewers/ViewerPickle.vue';
// import ViewerProtobuf from '@/vue/redis/viewers/ViewerProtobuf.vue';

import { objectUtil } from "@/vue/util/objectUtil";
export default {
	data() {
		return {
			viewerComponent: 'ViewerText',
			newContent: null,
		};
	},
	props: {
		content: { default: () => Buffer.from('') },
		remainHeight: { type: Number, default: window.innerHeight - 100 },
		selectedView: { type: String, default: 'ViewerText'},
	},
	components: {
		ViewerText,
		ViewerJson,
		ViewerJavaSerialize,
		ViewerHex,
		ViewerBinary,
		ViewerBrotli,
		ViewerDeflate,
		ViewerDeflateRaw,
		ViewerGzip,
		ViewerPHPSerialize,
		// ViewerPickle,
		// ViewerProtobuf,
	},
	
	watch: {
		selectedView:{
			handler (newVal) {
				this.viewerComponent = newVal
     		},
      		deep: true,
	    	immediate: true,
		},
		content:{
			handler (newVal) {
				this.newContent = Buffer.from(this.content);
				this.autoSelectedView();
     		},
      		deep: true,
	    	immediate: true,
		}
	},
	methods: {
		getContent() {
			if (typeof this.$refs.viewer.getContent === 'function') {
				return this.$refs.viewer.getContent();
			}
			return this.content;
		},
		changeViewer(value){
			this.$emit("changeSelectedView",value);
			this.viewerComponent = value;
		},
		autoSelectedView(){
			if (!this.newContent || !this.newContent.length) {
				return this.changeViewer('ViewerText');
			}

			// json
			if (objectUtil.isJson(this.newContent)) {
				return this.changeViewer('ViewerJson');
			}
			// php unserialize
			if (objectUtil.isPHPSerialize(this.newContent)) {
				return this.changeViewer('ViewerPHPSerialize');
			}
			// java unserialize
			if (objectUtil.isJavaSerialize(this.newContent)) {
				return this.changeViewer('ViewerJavaSerialize');
			}
			// pickle
			// if (objectUtil.isPickle(this.newContent)) {
			// 	return this.changeViewer('ViewerPickle');
			// }
			// msgpack
			if (objectUtil.isMsgpack(this.newContent)) {
				return this.changeViewer('ViewerMsgpack');
			}
			// brotli unserialize
			if (objectUtil.isBrotli(this.newContent)) {
				return this.changeViewer('ViewerBrotli');
			}
			// gzip
			if (objectUtil.isGzip(this.newContent)) {
				return this.changeViewer('ViewerGzip');
			}
			// deflate
			if (objectUtil.isDeflate(this.newContent)) {
				return this.changeViewer('ViewerDeflate');
			}
			// protobuf
			// if (objectUtil.isProtobuf(this.newContent)) {
			// 	return this.changeViewer('ViewerProtobuf');
			// }
			// deflateRaw
			if (objectUtil.isDeflateRaw(this.newContent)) {
				return this.changeViewer('ViewerDeflateRaw');
			}

			// hex
			if (!objectUtil.bufVisible(this.newContent)) {
				return this.changeViewer('ViewerHex');
			}
			
			return this.changeViewer('ViewerText');
		}
	},
	mounted() {
		this.autoSelectedView();
	},
};
</script>
  