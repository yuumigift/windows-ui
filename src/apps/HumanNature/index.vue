<template>
    <div class="container">
        <div v-if="!hasImg">图片加载中</div>
        <img v-if="hasImg" :src="randomImgUrl" alt="" />
    </div>
</template>

<script lang="ts" setup>
const randomImgUrl = ref("");
const hasImg = ref(false)

onMounted(() => {
    generateRandomImgUrl();
});

async function fetchImage(url: string): Promise<string> {
    return new URL(url, import.meta.url).href;
}

// 生成一个0到10之间的随机数的函数
const generateRandomImgUrl = async () => {
    // randomImgUrl.value = `./assets/${Math.floor(Math.random() * 11)}.png`
    const randomNumber = Math.floor(Math.random() * 11);
    randomImgUrl.value = await fetchImage(`./assets/${randomNumber}.jpg`);
    hasImg.value = true
};
</script>

<style scoped>
    .container {
        position: relative;
        overflow-y: scroll;
        max-height: 800px;
    }

    .container img {
        display: block;
        max-width: 100%;
        height: auto;
    }
</style>