<script setup>
import { ref } from 'vue'
import axios from 'axios'

const prompt = ref('')
const generated = ref('')
const imgs = ref('')
const imgStyle = ref('')

const imageStyles = ref({
  "Dark": "Dark mood",
  "Light": "Light mood",
  "Cartoon": "Cartoon style",
  "Abstract": "Abstract style",
  "Realistic": "Realistic style"
});

const generate = async () => {
  let res = await axios.post('http://localhost:8000/api/generate', { prompt: prompt.value  });
  console.log(res);
  generated.value = res.data;
}

const generateImg = async () => {
  // distill response using openAI
  let distilled = await axios.post('http://localhost:8000/api/generate', { prompt: `Describe an image in one sentence to accompany the following article as a DALLE image generator prompt. Do not include people. Stylish. News Article. Flashy. Attention grabbing. ${imgStyle.value}:\n${generated.value}` });

  console.log("Distilled", distilled)

  // generate 5 images
  let res = await axios.post('http://localhost:8000/api/generateImage', { prompt: distilled.data + " Do not include people. Stylish. News Article. Flashy. Attention grabbing. " + imgStyle.value  });
  imgs.value = res.data;
}
</script>

<template>
  <div>
    <textarea class="textarea textarea-bordered w-full" placeholder="Prompt"
    :value="prompt"
    @input="event => prompt = event.target.value"
    ></textarea>
    <div class="flex w-full justify-center">
      <button class="flex-initial btn m-3" @click="generate()">Generate</button>
    </div>
    <textarea class="textarea textarea-bordered w-full" style="height:400px;" placeholder="Response"
    :value="generated"
    @input="event => generated = event.target.value"
    ></textarea>
    <div class="flex w-full justify-center">
      <select v-model="imgStyle" class="flex-initial select select-bordered w-full max-w-xs">
        <option v-for="value, key in imageStyles" :key="key" :value="value">{{ key }}</option>
      </select>
    </div>
    <div class="flex w-full justify-center">
      <button class="flex-initial btn m-3" @click="generateImg()">Generate Images</button>
    </div>
    <div class="flex justify-center">
      <img v-for="img in imgs" :key="img.url" :src="img.url" />
    </div>
  </div>
</template>