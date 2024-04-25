<template>
    <div style="font-size:20px;background-color:darkgray;color:red;padding:20px;" ref="dom">
        你可以关闭窗口了，我已经启动了
    </div>
</template>
<script lang="ts" setup>
    import { ref, onMounted} from 'vue';
    const dom  = ref<HTMLElement|null>(null);

    //load script by html hacker
    onMounted(() => {
        const id = 'ai-script';
        if(document.getElementById(id)){
            console.log('already exists')
            return;
        };
        // src="dist/ai_tool_extern.umd.js" pos='{"left":"50px","top":"50px"}' delay="2000" title="你好，智能助手" server="http://47.99.46.60:83/xchat"  
        const script = document.createElement('script');
        script.id = id;
        script.setAttribute("src","http://chat.weixindanmu.com/V-LAB/script/ai_tool_extern.umd.js");
        script.setAttribute("pos",'{"left":"150px","top":"150px"}');
        script.setAttribute("title","你好，我是悠米助手");
        script.setAttribute("ai_role","我是宇宙无敌大帅逼，有什么事尽管问吧");
        script.setAttribute("server","http://47.99.46.60:83/xchat");
        document.head.appendChild(script);

        script.onload = ()=>{
            //kill pop window
            const btn = dom.value?.parentElement?.parentElement?.querySelector('.controls--btn.is_close');
            if(btn)btn.dispatchEvent(new Event('click'));
            //replace icon
        }

        //
    });
</script>
<style >

</style>