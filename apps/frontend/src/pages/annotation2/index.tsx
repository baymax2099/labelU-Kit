import { useState, useEffect, createRef } from 'react';
import { useLocation } from 'react-router';
import { useDispatch } from 'react-redux';

import Annotation from '../../components/business/annotation';
import currentStyles from './index.module.scss';
import { getTask, getSample, getPreSample } from '../../services/samples';
import commonController from '../../utils/common/common';
import SlideLoader from '../../components/slideLoader';
import { updateCurrentSampleId } from '../../stores/sample.store';
import AnnotationRightCorner from '../../components/annotationRightCorner';

// import TF from './tF';
export const annotationRef = createRef();

// @ts-ignore
const AnnotationPage = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [taskConfig, setTaskConfig] = useState<any>({});
  const [taskSample, setTaskSample] = useState<any>([]);
  const getDatas = async function (taskId: number, sampleId: number) {
    try {
      const taskRes = await getTask(taskId);
      // @ts-ignore
      if (taskRes.status === 200) {
        // @ts-ignore
        setTaskConfig(JSON.parse(taskRes?.data.data.config));
      } else {
        commonController.notificationErrorMessage({ message: '请求任务出错' }, 1);
        return;
      }
      const sampleRes = await getSample(taskId, sampleId);
      if (sampleRes.status === 200) {
        const newSample = commonController.transformFileList(sampleRes.data.data.data, sampleRes.data.data.id);
        setTaskSample(newSample);
      } else {
        commonController.notificationErrorMessage({ message: '请求任务出错' }, 1);
      }
    } catch (err) {
      commonController.notificationErrorMessage(err, 1);
    }
  };

  useEffect(() => {
    const taskId = parseInt(window.location.pathname.split('/')[2]);
    const sampleId = parseInt(window.location.pathname.split('/')[4]);

    getDatas(taskId, sampleId)
      // eslint-disable-next-line no-console
      .catch((err) => console.error(err));
    // @ts-ignore
    dispatch(updateCurrentSampleId(sampleId));
  }, [dispatch, location]);

  const goBack = () => {};
  const leftSiderContent = <SlideLoader />;
  const topActionContent = <AnnotationRightCorner />;
  const updatePrevImageListResult = async function () {
    const taskId = parseInt(window.location.pathname.split('/')[2]);
    const sampleId = parseInt(window.location.pathname.split('/')[4]);

    getPreSample(taskId, sampleId)
      .then((res: any) => {
        if (res.status === 200) {
          const result = res.data.data.data.result;
          const newTaskSample = [{ ...taskSample[0], result }];
          setTaskSample(newTaskSample);
        } else {
          commonController.notificationErrorMessage({ message: '请求数据错误' }, 1);
        }
      })
      .catch((error) => commonController.notificationErrorMessage(error, 1));
  };
  useEffect(() => {
    const search = window.location.search;
    if (search.indexOf('COPYPRE') > -1) {
      updatePrevImageListResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={currentStyles.annotationPage}>
      {/*{ t[0].result }*/}
      {/*  <TF t1 = {t} />*/}
      {/*  <div>{taskSampleC}</div>*/}
      {taskSample && taskSample.length > 0 && taskConfig.tools && taskConfig.tools.length > 0 && (
        <Annotation
          leftSiderContent={leftSiderContent}
          topActionContent={topActionContent}
          annotationRef={annotationRef}
          attribute={taskConfig.attribute}
          tagList={taskConfig.tagList}
          fileList={[{ ...taskSample[0] }]}
          textConfig={taskConfig.textConfig}
          goBack={goBack}
          tools={taskConfig.tools}
          // exportData = {exportData}
          // onSubmit = {onSubmit}
          commonAttributeConfigurable={taskConfig.commonAttributeConfigurable}
        />
      )}
    </div>
  );
};
export default AnnotationPage;
