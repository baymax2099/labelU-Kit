import React, { useContext } from 'react';

import type { SampleResponse } from '@/services/types';

import SliderCard from '../sliderCard';
import currentStyles from './index.module.scss';
import { SAMPLE_CHANGED } from '../annotationRightCorner';
import AnnotationContext from '../../annotation.context';

export const slideRef = React.createRef<HTMLDivElement>();

const SlideLoader = () => {
  const handleSampleClick = (sample: SampleResponse) => {
    document.dispatchEvent(
      new CustomEvent(SAMPLE_CHANGED, {
        detail: {
          sampleId: sample.id,
        },
      }),
    );
  };

  /**
   * 切换文件时
   * 1. 下一张或者上一张时，需要将当前的标注结果更新到当前文件后，再进行切换
   *    1.1 如果当前文件是「跳过」的状态，那么不需要更新标注结果
   *    1.2 如果当前文件是「完成」的状态，那么需要更新标注结果，并且将当前文件的状态改为「完成」
   * 2. 将当前文件标记为「跳过」，更新文件状态为「跳过」，然后跳到下一张
   * 3. 将当前文件标记为「取消跳过」，更新文件状态为「新」
   */
  // context中的samples会随着「跳过」、「取消跳过」、「完成」的操作而更新，但上面的useScrollFetch只有滚动的时候才会触发更新
  const { samples: samplesFromContext, task } = useContext(AnnotationContext);

  return (
    <div className={currentStyles.leftBar} ref={slideRef}>
      {samplesFromContext?.map((item: SampleResponse) => {
        return <SliderCard cardInfo={item} type={task.media_type} key={item.id} onClick={handleSampleClick} />;
      })}
    </div>
  );
};

export default SlideLoader;
