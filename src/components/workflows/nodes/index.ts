import { PromptInputNode } from './PromptInputNode';
import { TextGenNode } from './TextGenNode';
import { ImageGenNode } from './ImageGenNode';
import { VideoGenNode } from './VideoGenNode';
import { AudioGenNode } from './AudioGenNode';
import { ImageUpscaleNode } from './ImageUpscaleNode';
import { StorageNode } from './StorageNode';
import { ConditionNode } from './ConditionNode';
import { DelayNode } from './DelayNode';
import { NotificationNode } from './NotificationNode';
import { CustomApiNode } from './CustomApiNode';

export const nodeTypes = {
  promptInput: PromptInputNode,
  textGen: TextGenNode,
  imageGen: ImageGenNode,
  videoGen: VideoGenNode,
  audioGen: AudioGenNode,
  imageUpscale: ImageUpscaleNode,
  storage: StorageNode,
  condition: ConditionNode,
  delay: DelayNode,
  notification: NotificationNode,
  customApi: CustomApiNode
};
