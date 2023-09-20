import type { EnumerableAttribute, TextAttribute } from '@label-u/annotation';
import type {
  Attribute,
  TagAnnotationEntity,
  TextAnnotationEntity,
  VideoAnnotationData,
  VideoSegmentToolConfig,
  VideoFrameToolConfig,
  VideoAnnotationType,
} from '@label-u/interface';
import { createContext } from 'react';

export interface VideoEditorConfig {
  // 标签分类
  tag?: EnumerableAttribute[];
  // 文本描述
  text?: TextAttribute[];
  // 分割工具
  segment: VideoSegmentToolConfig;
  // 帧工具
  frame: VideoFrameToolConfig;
}

export type VideoAnnotationInEditor = VideoAnnotationData & {
  visible?: boolean;
};

export type VideoWithGlobalAnnotation = VideoAnnotationInEditor | TextAnnotationEntity | TagAnnotationEntity;

export interface VideoSample {
  id: string | number;
  name?: string;
  url: string;
  annotations: VideoWithGlobalAnnotation[];
  meta?: {
    width: number;
    height: number;
    duration: number;
  };
}
export interface EditorContextType {
  currentTool: VideoAnnotationType | undefined;
  samples: VideoSample[];
  config?: VideoEditorConfig;
  videoAnnotations: VideoAnnotationInEditor[];
  attributes: Attribute[];
  orderVisible: boolean;
  currentSample?: VideoSample;
  attributeMapping: Record<string, Record<string, Attribute>>;
  annotationsMapping: Record<string, VideoWithGlobalAnnotation>;
  selectedAnnotation: VideoAnnotationInEditor | undefined;
  selectedAttribute: Attribute | undefined;
  videoWrapperRef: React.RefObject<HTMLDivElement>;
  handleSelectSample: (sample: VideoSample) => void;
  onToolChange: (tool?: VideoAnnotationType) => void;
  onLabelChange: (attribute: Attribute) => void;
  onAnnotationRemove: (annotation: VideoAnnotationInEditor) => void;
  onAnnotationsRemove: (annotations: VideoWithGlobalAnnotation[]) => void;
  onAnnotationSelect: (annotation: VideoAnnotationInEditor) => void;
  onAnnotationChange: (annotation: VideoAnnotationInEditor) => void;
  onOrderVisibleChange: (visible: boolean) => void;
  onAttributeChange: (payload: any) => void;
  onAnnotationsChange: (annotations: VideoWithGlobalAnnotation[]) => void;
  playerRef: React.RefObject<any>;
  redo: () => void;
  undo: () => void;
  pastRef: React.RefObject<VideoSample[]>;
  futureRef: React.RefObject<VideoSample[]>;
}

const EditorContext = createContext<EditorContextType>({} as EditorContextType);

export default EditorContext;
