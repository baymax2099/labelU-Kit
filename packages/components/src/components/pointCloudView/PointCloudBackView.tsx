import { PointCloud, MathUtils, PointCloudAnnotation, Attribute } from '@label-u/annotation';
import { getClassName } from '@/utils/dom';
import { PointCloudContainer } from './PointCloudLayout';
import React, { useEffect, useRef } from 'react';
import { PointCloudContext } from './PointCloudContext';
import { useSingleBox } from './hooks/useSingleBox';
import { IPointCloudBox, IPolygonPoint } from '@label-u/utils';
// import { SizeInfoForView } from './PointCloudInfos';
import { connect } from 'react-redux';
import { aMapStateToProps, IAnnotationStateProps } from '@/store/annotation/map';
import useSize from '@/hooks/useSize';
import EmptyPage from './components/EmptyPage';
import { useTranslation } from 'react-i18next';
import { LabelUContext } from '@/store/ctx';
import { usePointCloudViews } from './hooks/usePointCloudViews';

/**
 * 统一一下，将其拓展为 二维转换为 三维坐标的转换
 * Get the offset from canvas2d-coordinate to world coordinate
 * @param currentPos
 * @param size
 * @param zoom
 * @returns
 */
const TransferCanvas2WorldOffset = (
  currentPos: { x: number; y: number },
  size: { width: number; height: number },
  zoom = 1,
) => {
  const { width: w, height: h } = size;

  const canvasCenterPoint = {
    x: currentPos.x + (w * zoom) / 2,
    y: currentPos.y + (h * zoom) / 2,
  };

  const worldCenterPoint = {
    x: size.width / 2,
    y: size.height / 2,
  };

  return {
    offsetX: (worldCenterPoint.x - canvasCenterPoint.x) / zoom,
    offsetY: -(worldCenterPoint.y - canvasCenterPoint.y) / zoom,
  };
};
// TODO: make the positon of plygon stable
const updateBackViewByCanvas2D = (
  currentPos: { x: number; y: number },
  zoom: number,
  size: { width: number; height: number },
  selectedPointCloudBox: IPointCloudBox,
  backPointCloud: PointCloud,
) => {
  const { offsetX, offsetY } = TransferCanvas2WorldOffset(currentPos, size, zoom);
  backPointCloud.camera.zoom = zoom;
  if (currentPos) {
    const cos = Math.cos(selectedPointCloudBox.rotation);
    const sin = Math.sin(selectedPointCloudBox.rotation);
    const offsetXX = offsetX * cos;
    const offsetXY = offsetX * sin;
    const { x, y, z } = backPointCloud.initCameraPosition;
    backPointCloud.camera.position.set(x + offsetXY, y - offsetXX, z + offsetY);
  }
  // if (
  //   !backPointCloud.scene.getObjectByName('selectedPointCloud') &&
  //   backPointCloud.selectedPointCloud
  // ) {

  // }
  backPointCloud.removeObjectByName('selectedPointCloud');
  backPointCloud.scene.add(backPointCloud.selectedPointCloud);
  backPointCloud.camera.updateProjectionMatrix();
  backPointCloud.render();
};

const PointCloudSideView = ({
  currentData,
  attributes,
}: IAnnotationStateProps & {
  attributes: Attribute[];
}) => {
  const ptCtx = React.useContext(PointCloudContext);
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);
  const { updateSelectedBox, selectedBox } = useSingleBox();
  const { t } = useTranslation();

  const { syncPointCloudViewsFromBox } = usePointCloudViews();

  useEffect(() => {
    if (ref.current) {
      const size = {
        width: ref.current.clientWidth,
        height: ref.current.clientHeight,
      };

      const pointCloudAnnotation = new PointCloudAnnotation({
        container: ref.current,
        size,
        polygonOperationProps: { showDirectionLine: false, forbidAddNew: true },
      });
      pointCloudAnnotation.pointCloud2dOperation.setAllAttributes(attributes);
      ptCtx.setBackViewInstance(pointCloudAnnotation);
    }
  }, []);

  useEffect(() => {
    // By the way as an initialization judgment
    if (!size || !ptCtx.backViewInstance) {
      return;
    }

    const {
      pointCloud2dOperation: backPointCloudPolygonOperation,
      pointCloudInstance: backPointCloud,
    } = ptCtx.backViewInstance;

    /**
     * Synchronized 3d point cloud view displacement operations
     *
     * Change Orthographic Camera size
     */
    backPointCloudPolygonOperation.singleOn('renderZoom', (zoom: number, currentPos: any) => {
      if (!ptCtx.selectedPointCloudBox) {
        return;
      }
      updateBackViewByCanvas2D(currentPos, zoom, size, ptCtx.selectedPointCloudBox, backPointCloud);
    });

    // Synchronized 3d point cloud view displacement operations
    backPointCloudPolygonOperation.singleOn('dragMove', ({ currentPos, zoom }: any) => {
      if (!ptCtx.selectedPointCloudBox) {
        return;
      }
      updateBackViewByCanvas2D(currentPos, zoom, size, ptCtx.selectedPointCloudBox, backPointCloud);
    });

    backPointCloudPolygonOperation.singleOn(
      'updatePolygonByDrag',
      ({ newPolygon, originPolygon }: any) => {
        if (!ptCtx.selectedPointCloudBox || !ptCtx.mainViewInstance || !currentData.url) {
          return;
        }
        // Notice. The sort of polygon is important.
        const [point1, point2, point3] = newPolygon.pointList;
        const [op1, op2, op3] = originPolygon.pointList;

        // 2D centerPoint => 3D x & z
        const newCenterPoint = MathUtils.getLineCenterPoint([point1, point3]);
        const oldCenterPoint = MathUtils.getLineCenterPoint([op1, op3]);

        const offsetCenterPoint = {
          x: newCenterPoint.x - oldCenterPoint.x,
          y: 0, // Not be used.
          z: newCenterPoint.y - oldCenterPoint.y,
        };

        // 2D height => 3D depth
        const height = MathUtils.getLineLength(point1, point2);
        const oldHeight = MathUtils.getLineLength(op1, op2);
        const offsetHeight = height - oldHeight; // 3D depth

        // 2D width => 3D width
        const width = MathUtils.getLineLength(point2, point3);
        const oldWidth = MathUtils.getLineLength(op2, op3);
        const offsetWidth = width - oldWidth; // 3D width

        let { newBoxParams } = backPointCloud.getNewBoxByBackUpdate(
          offsetCenterPoint,
          offsetWidth,
          offsetHeight,
          ptCtx.selectedPointCloudBox,
        );
        // box in 3d scene
        let box = ptCtx.mainViewInstance.getCuboidFromPointCloudBox(newBoxParams)
          .polygonPointList as [IPolygonPoint, IPolygonPoint, IPolygonPoint, IPolygonPoint];

        // set new box
        newBoxParams.rect = box;
        newBoxParams.zInfo = {
          maxZ: newBoxParams.center.z + newBoxParams.depth / 2,
          minZ: newBoxParams.center.z - newBoxParams.depth / 2,
        };

        // Update count
        if (ptCtx.mainViewInstance) {
          const { count } = ptCtx.mainViewInstance.getSensesPointZAxisInPolygon(
            ptCtx.mainViewInstance.getCuboidFromPointCloudBox(newBoxParams)
              .polygonPointList as IPolygonPoint[],
            [
              newBoxParams.center.z - newBoxParams.depth / 2,
              newBoxParams.center.z + newBoxParams.depth / 2,
            ],
          );

          newBoxParams = {
            ...newBoxParams,
            count,
          };
        }
        ptCtx.mainViewInstance?.updateOneBoxList(newBoxParams);

        // TODO: update view by change selected box
        // ptCtx.mainViewInstance.emit('changeSelectedBox', box, newBoxParams.id);
        syncPointCloudViewsFromBox?.(newBoxParams);

        // save new Boxlist
        const newBoxList = ptCtx.mainViewInstance?.boxList;
        ptCtx.mainViewInstance.emit('savePcResult', newBoxList);

        updateSelectedBox(newBoxParams);
      },
    );
  }, [ptCtx, size]);

  useEffect(() => {
    // Update Size
    ptCtx?.backViewInstance?.initSize(size);
  }, [size]);

  return (
    <PointCloudContainer
      className={getClassName('point-cloud-container', 'back-view')}
      title={t('BackView')}
      // toolbar={<SizeInfoForView perspectiveView={EPerspectiveView.Back} />}
    >
      <div className={getClassName('point-cloud-container', 'bottom-view-content')}>
        <div className={getClassName('point-cloud-container', 'core-instance')} ref={ref} />
        {!selectedBox && <EmptyPage />}
      </div>
    </PointCloudContainer>
  );
};

export default connect(aMapStateToProps, null, null, { context: LabelUContext })(
  PointCloudSideView,
);
