import React from 'react';
import {
  Modal,
  Text,
  Button,
  LegacyStack,
  List,
  Link,
  Card,
  Image
} from '@shopify/polaris';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How Volume Pricing Works"
      primaryAction={{
        content: 'Got it',
        onAction: onClose
      }}
    >
      <Modal.Section>
        <LegacyStack vertical spacing="loose">
          <Text variant="bodyMd" as="p">
            Volume pricing helps you increase sales by offering discounts when customers buy more. Here's how to set it up:
          </Text>
          
          <List type="number">
            <List.Item>
              <Text variant="bodyMd" fontWeight="semibold" as="span">Pick products</Text>
              <Text variant="bodyMd" as="p">
                Select which products should have volume pricing. You can choose multiple products or variants.
              </Text>
            </List.Item>
            
            <List.Item>
              <Text variant="bodyMd" fontWeight="semibold" as="span">Define quantity tiers</Text>
              <Text variant="bodyMd" as="p">
                Set up pricing tiers based on quantity. For example: 5-9 items = 10% off, 10+ items = 15% off.
              </Text>
            </List.Item>
            
            <List.Item>
              <Text variant="bodyMd" fontWeight="semibold" as="span">Choose how it looks</Text>
              <Text variant="bodyMd" as="p">
                Select from different display styles: badge rows, tier tables, or inline banners.
              </Text>
            </List.Item>
            
            <List.Item>
              <Text variant="bodyMd" fontWeight="semibold" as="span">Save & toggle on</Text>
              <Text variant="bodyMd" as="p">
                Save your configuration and activate it. Customers will see the discounts automatically at checkout.
              </Text>
            </List.Item>
          </List>
          
          <Card>
            <LegacyStack vertical spacing="tight">
              <Text variant="headingMd" as="h3">Example Setup</Text>
              <Image
                source="https://cdn.shopify.com/s/files/1/0533/2089/files/volume-pricing-example.png"
                alt="Volume pricing example showing tier discounts"
                width="100%"
              />
              <Text variant="bodySm" tone="subdued" as="p">
                This example shows how volume pricing appears to customers on your product page.
              </Text>
            </LegacyStack>
          </Card>
          
          <Text variant="bodyMd" as="p">
            Need more help? Check out our{' '}
            <Link url="https://help.shopify.com/en/manual/discounts/volume-pricing" external>
              detailed documentation
            </Link>{' '}
            or contact support.
          </Text>
        </LegacyStack>
      </Modal.Section>
    </Modal>
  );
}

