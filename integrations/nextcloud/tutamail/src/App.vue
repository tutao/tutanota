<script setup lang="ts">
import NcAppContent from '@nextcloud/vue/components/NcAppContent'
import NcContent from '@nextcloud/vue/components/NcContent'
</script>

<template>
	<NcContent app-name="tutamail">
		<NcAppContent :class="$style.content">
			<h2>Hello world!</h2>
		</NcAppContent>
	</NcContent>
</template>

<style module>
.content {
	display: flex;
	justify-content: center;
	margin: 16px;
}
</style>
